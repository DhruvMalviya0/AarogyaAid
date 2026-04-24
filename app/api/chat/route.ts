import { NextRequest, NextResponse } from "next/server";

import { AAROGYAAID_AGENT_CONFIG } from "@/lib/rag/agentConfig";
import { UserProfile } from "@/lib/rag/types";
import { retrieve_policy_chunks } from "@/lib/rag/vectorStore";

type ChatBody = {
  question: string;
  profile: UserProfile;
  previous_recommendation?: {
    policy_name: string;
    insurer: string;
    monthly_premium: number;
    waiting_period_months: number;
    suitability_score: number;
  };
};

type ChatResponse = {
  direct_answer: string;
  worked_example: string;
  document_citation: string;
};

function isMedicalAdviceQuery(question: string): boolean {
  const q = question.toLowerCase();
  return ["dosage", "medicine", "treatment", "diagnosis", "cure", "tablet", "doctor", "bp reading"].some((k) =>
    q.includes(k)
  );
}

function primaryCondition(profile: UserProfile): string {
  return profile.conditions.find((c) => c.toLowerCase() !== "none") ?? "Hypertension";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatBody;

    if (!body.question || !body.profile) {
      return NextResponse.json({ error: "question and profile are required" }, { status: 400 });
    }

    // Strict grounding requirement: always use configured retrieval tool for policy-grounded answers.
    const retrievalTool = AAROGYAAID_AGENT_CONFIG.retrievalToolName;
    if (retrievalTool !== "retrieve_policy_chunks") {
      return NextResponse.json({ error: "retrieval tool misconfigured" }, { status: 500 });
    }

    const chunks = await retrieve_policy_chunks(body.question, body.profile);
    const top = chunks[0];
    const condition = primaryCondition(body.profile);
    const prior = body.previous_recommendation;

    if (!top) {
      const fallback: ChatResponse = {
        direct_answer: `I understand your concern about ${condition}. I do not have enough policy text to answer this safely yet.`,
        worked_example: `If you are hospitalized in ${body.profile.city} for ${condition}, we need policy wording to confirm waiting period and exclusions before estimating claim behavior.`,
        document_citation: "Citation unavailable: no policy chunks retrieved.",
      };
      return NextResponse.json(fallback, { status: 200 });
    }

    const citation = `${top.policyName} (Page ${top.pageNumber ?? 1})`;

    if (isMedicalAdviceQuery(body.question)) {
      const response: ChatResponse = {
        direct_answer:
          `I hear your concern about ${condition}. I cannot provide medical advice, but I can help you understand what this policy may cover financially.`,
        worked_example:
          `If a doctor advises hospitalization in ${body.profile.city} for ${condition}, this policy indicates a ${top.waitingPeriodMonths}-month waiting period before related claims are generally considered, subject to underwriting terms.`,
        document_citation: citation,
      };
      return NextResponse.json(response, { status: 200 });
    }

    const question = body.question.toLowerCase();
    let directAnswer =
      `I understand your concern about ${condition}. Based on the policy wording, this plan can be evaluated using waiting period (${top.waitingPeriodMonths} months), co-pay (${top.coPayPercent}%), and exclusions.`;

    if (prior) {
      directAnswer += ` Your previous recommendation was ${prior.policy_name} by ${prior.insurer} (score ${prior.suitability_score}/100, waiting period ${prior.waiting_period_months} months, monthly premium INR ${prior.monthly_premium}).`;
    }

    if (question.includes("cosmetic") || question.includes("exclusion")) {
      const exclusionLine = top.exclusions.find((e) => e.toLowerCase().includes("cosmetic")) ?? top.exclusions[0] ?? "elective non-medical procedures";
      directAnswer = `I understand your concern about ${condition}. Cosmetic surgery is excluded under this policy because it is treated as elective/non-medical unless tied to medically necessary reconstruction after accident, as described in the exclusion clause (${exclusionLine}).`;
    }

    const workedExample =
      `Example: If you are hospitalized at a network hospital in ${body.profile.city} for ${condition}, this policy's ${top.waitingPeriodMonths}-month waiting period means a related claim is typically considered after that period. Once eligible, your expected co-pay under this plan is ${top.coPayPercent}% with claim mode listed as ${top.claimType}.`;

    const response: ChatResponse = {
      direct_answer: directAnswer,
      worked_example: workedExample,
      document_citation: citation,
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to answer chat question" }, { status: 500 });
  }
}
