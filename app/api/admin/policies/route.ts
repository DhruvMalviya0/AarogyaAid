import { NextResponse } from "next/server";

const mockPolicies = [
  {
    id: "policy_1",
    fileName: "diabetes-cover-2026.pdf",
    uploadDate: "2026-04-22",
    policyName: "Aarogya Secure Plus",
    insurer: "SecureHealth",
    chunkIds: ["chunk_1", "chunk_2"],
  },
];

export async function GET() {
  return NextResponse.json({ policies: mockPolicies }, { status: 200 });
}
