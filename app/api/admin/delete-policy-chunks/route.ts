import { NextRequest, NextResponse } from "next/server";

import { deletePolicyChunksById } from "@/lib/rag/vectorStore";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { chunkIds?: string[] };

    if (!body.chunkIds || body.chunkIds.length === 0) {
      return NextResponse.json({ error: "chunkIds are required" }, { status: 400 });
    }

    const deletion = await deletePolicyChunksById(body.chunkIds);
    return NextResponse.json(
      {
        ok: true,
        deletedCount: deletion.deletedCount,
        deletedAt: deletion.deletedAt,
        immediate: deletion.immediate,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Immediate deletion failed. Please verify vector store connectivity." },
      { status: 502 }
    );
  }
}
