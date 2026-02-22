import { NextResponse } from "next/server";
import { unlink, readFile } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const doc = await prisma.document.findFirst({
    where: { id, userId: parseInt(userId, 10) },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(join(process.cwd(), doc.filepath));
    return new Response(buffer, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${doc.filename}"`,
      },
    });
  } catch (err) {
    logger.error("Documents", "Could not read file", err);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt((await params).id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const doc = await prisma.document.findFirst({
    where: { id, userId: parseInt(userId, 10) },
  });

  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chunk.deleteMany({ where: { documentId: id } });
  await prisma.document.delete({ where: { id } });

  const fullPath = join(process.cwd(), doc.filepath);
  try {
    await unlink(fullPath);
  } catch (err) {
    logger.error("Documents", "Could not delete file", err);
  }

  logger.doc("Document gelöscht", { docId: id, filename: doc.filename });
  return new Response(null, { status: 204 });
}
