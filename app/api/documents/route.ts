import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: parseInt(userId, 10) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      status: true,
      chunkCount: true,
      createdAt: true,
      mimeType: true,
    },
  });

  return NextResponse.json(documents);
}
