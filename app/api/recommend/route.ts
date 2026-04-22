import { NextRequest, NextResponse } from "next/server";

import { runRecommendationPipeline } from "@/lib/rag/recommend";
import { recommendRequestSchema } from "@/lib/validation/recommendation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = recommendRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await runRecommendationPipeline(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
