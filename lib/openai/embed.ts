import { openai, EMBED_MODEL } from "./index";
import { logger } from "@/lib/logger";

export async function embedText(text: string): Promise<number[]> {
  const start = Date.now();
  const response = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) throw new Error("No embedding returned");
  logger.embed("API call", {
    durationMs: Date.now() - start,
    dims: embedding.length,
    inputChars: text.length,
  });
  return embedding;
}
