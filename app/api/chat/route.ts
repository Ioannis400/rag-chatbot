import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { openai, MODEL } from "@/lib/openai";
import { embedText } from "@/lib/openai/embed";
import { hybridSearchChunks } from "@/lib/rag/search";
import { CHAT, SEARCH } from "@/config";
import { buildSystemPrompt } from "@/lib/rag/context";
import { toolDefinitions, executeTool } from "@/lib/tools";
import { logger } from "@/lib/logger";
import type { ResponseFunctionToolCall } from "openai/resources/responses/responses";

const schema = z.object({
  message: z.string().min(1, { error: "Nachricht darf nicht leer sein" }),
  conversationId: z.number().optional(),
});

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = parseInt(userId, 10);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "Ungültige Eingabe";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { message, conversationId } = parsed.data;

  let convId = conversationId;
  if (convId == null) {
    const conv = await prisma.conversation.create({
      data: { userId: uid },
    });
    convId = conv.id;
  } else {
    const exists = await prisma.conversation.findFirst({
      where: { id: convId, userId: uid },
    });
    if (!exists) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  }

  await prisma.message.create({
    data: { conversationId: convId!, role: "user", content: message },
  });

  const messages = await prisma.message.findMany({
    where: { conversationId: convId! },
    orderBy: { createdAt: "asc" },
    take: CHAT.MAX_MESSAGES,
  });

  const ragStart = Date.now();
  logger.rag("Query start", { convId, queryLength: message.length });

  const emb = await embedText(message);
  logger.embed("Query embedded", { dims: emb.length });

  const chunks = await hybridSearchChunks(emb, message, uid, SEARCH.TOP_K);
  const uniqueSources = [...new Set(chunks.map((c) => c.filename))];
  logger.rag("Hybrid-Search done", {
    chunks: chunks.length,
    sources: uniqueSources,
    durationMs: Date.now() - ragStart,
  });

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { name: true },
  });
  const systemPrompt = buildSystemPrompt(chunks, user);

  type InputItem =
    | { role: "user"; content: string }
    | { role: "assistant"; content: string }
    | { role: "system"; content: string }
    | ResponseFunctionToolCall
    | { type: "function_call_output"; call_id: string; output: string };

  const history: InputItem[] = messages
    .filter((m) => m.role !== "tool")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const input: InputItem[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let currentInput: InputItem[] = [...input];
      let fullAssistantText = "";

      const runStream = async (): Promise<void> => {
        const response = await openai.responses.create({
          model: MODEL,
          input: currentInput,
          tools: toolDefinitions,
          stream: true,
        });

        let pendingToolCall: ResponseFunctionToolCall | null = null;

        for await (const event of response as AsyncIterable<{
          type: string;
          delta?: string;
          item?: ResponseFunctionToolCall;
        }>) {
          if (event.type === "response.output_text.delta" && event.delta) {
            fullAssistantText += event.delta;
            controller.enqueue(encoder.encode(event.delta));
          }
          if (
            event.type === "response.output_item.done" &&
            event.item &&
            (event.item as ResponseFunctionToolCall).type === "function_call"
          ) {
            pendingToolCall = event.item as ResponseFunctionToolCall;
            break;
          }
        }

        if (pendingToolCall) {
          const result = await executeTool(
            pendingToolCall.name,
            pendingToolCall.arguments ?? "{}",
            uid
          );
          currentInput = [
            ...currentInput,
            pendingToolCall,
            {
              type: "function_call_output" as const,
              call_id: pendingToolCall.call_id,
              output: result,
            },
          ];
          await runStream();
        }
      };

      try {
        await runStream();
        await prisma.message.create({
          data: {
            conversationId: convId!,
            role: "assistant",
            content: fullAssistantText,
          },
        });
        logger.chat("Response saved", {
          convId,
          responseLength: fullAssistantText.length,
        });
        if (uniqueSources.length > 0) {
          controller.enqueue(
            encoder.encode(`\n\n[[SOURCES:${uniqueSources.join("|")}]]`)
          );
        }
      } catch (err) {
        logger.error("Chat", "Stream error", err);
        controller.enqueue(
          encoder.encode("\n\n[Fehler bei der Antwortgenerierung.]")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
