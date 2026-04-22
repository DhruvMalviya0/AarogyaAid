import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF is supported" }, { status: 400 });
  }

  // TODO: parse PDF with pdf-parse, chunk text, embed, and upsert into vector store.
  return NextResponse.json({ ok: true, fileName: file.name }, { status: 200 });
}
