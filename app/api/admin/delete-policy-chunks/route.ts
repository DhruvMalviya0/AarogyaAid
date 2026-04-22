import { NextRequest, NextResponse } from "next/server";

import { deletePolicyChunksById } from "@/lib/rag/vectorStore";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { chunkIds?: string[] };

  if (!body.chunkIds || body.chunkIds.length === 0) {
    return NextResponse.json({ error: "chunkIds are required" }, { status: 400 });
  }

  await deletePolicyChunksById(body.chunkIds);
  return NextResponse.json({ ok: true }, { status: 200 });
}
