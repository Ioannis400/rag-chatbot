import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";
import { pool } from "@/lib/rag/search";
import { extractText } from "@/lib/rag/pdf";
import { chunkText } from "@/lib/rag/chunker";
import { embedText } from "@/lib/openai/embed";
import { UPLOAD } from "@/config";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = parseInt(userId, 10);

  let file: File;
  try {
    const formData = await request.formData();
    const f = formData.get("file");
    if (!f || !(f instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    file = f;
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!(UPLOAD.ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use PDF, TXT, or MD." },
      { status: 400 }
    );
  }
  if (file.size > UPLOAD.MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 10MB)" },
      { status: 400 }
    );
  }

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const filepath = `uploads/${uid}/${timestamp}-${filename}`;
  const dir = join(process.cwd(), "uploads", String(uid));

  const doc = await prisma.document.create({
    data: {
      userId: uid,
      filename,
      filepath,
      mimeType: file.type,
      status: "UPLOADED",
    },
  });

  const uploadStart = Date.now();
  logger.upload("Start", { filename, size: file.size, docId: doc.id, userId: uid });

  try {
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    const fullPath = join(process.cwd(), filepath);
    await writeFile(fullPath, buffer);

    const text = await extractText(buffer, file.type);
    logger.upload("Text extrahiert", { chars: text.length });

    const chunks = chunkText(text);
    const avgChunkLen = chunks.length > 0
      ? Math.round(chunks.reduce((a, c) => a + c.length, 0) / chunks.length)
      : 0;
    logger.upload("Chunking", { chunks: chunks.length, avgChars: avgChunkLen });

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      const embedding = await embedText(content);
      logger.embed(`Chunk ${i + 1}/${chunks.length}`, { dims: embedding.length });
      const vectorStr = `[${embedding.join(",")}]`;
      await pool.query(
        `INSERT INTO "Chunk" ("documentId", content, embedding, "createdAt")
         VALUES ($1, $2, $3::vector, NOW())`,
        [doc.id, content, vectorStr]
      );
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "INGESTED", chunkCount: chunks.length },
    });

    logger.upload("Fertig", {
      docId: doc.id,
      filename,
      chunks: chunks.length,
      durationMs: Date.now() - uploadStart,
    });

    return NextResponse.json({
      id: doc.id,
      filename,
      status: "INGESTED",
      chunkCount: chunks.length,
    });
  } catch (err) {
    logger.error("Upload", "Processing failed", err);
    await prisma.document.delete({ where: { id: doc.id } }).catch(() => {});
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
