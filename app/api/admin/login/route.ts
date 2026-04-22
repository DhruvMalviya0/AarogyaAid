import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { username?: string; password?: string };

  const isValid =
    body.username === process.env.ADMIN_USERNAME &&
    body.password === process.env.ADMIN_PASSWORD;

  if (!isValid) {
    return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
