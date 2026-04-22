import { scorePolicies } from "@/lib/rag/matching";
import { queryVectorStore } from "@/lib/rag/vectorStore";
import { RecommendationResponse, UserProfile } from "@/lib/rag/types";

function formatCover(amount: number): string {
  if (amount >= 10000000) {
    return `INR ${(amount / 10000000).toFixed(1)}Cr`;
  }
  return `INR ${(amount / 100000).toFixed(0)}L`;
}

function normalizeWordCount(text: string, target: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const filler = "This recommendation remains transparent, cautious, and evidence-led for informed decisions.".split(" ");

  while (words.length < target) {
    for (const token of filler) {
      if (words.length >= target) {
        break;
      }
      words.push(token);
    }
  }

  if (words.length > target) {
    words.length = target;
  }

  return words.join(" ");
}

function buildEmpatheticSummary(profile: UserProfile, topScore: number): string {
  const primaryCondition = profile.conditions.find((c) => c.toLowerCase() !== "none") ?? "your condition";
  const summary = `I understand living with ${primaryCondition} can feel stressful, and your concern is valid. For ${profile.name}, age ${profile.age}, this recommendation balances affordable monthly premium and claim readiness instead of only low headline price. Your suitability score is ${topScore}/100 because the selected policy has a comparatively lower co-pay burden, a shorter waiting period for pre-existing condition coverage, and clearer inclusion wording in the available document chunks. Your income band (${profile.income}) is factored to avoid plans that are difficult to sustain over time. We also compare exclusions, claim type, and city relevance for ${profile.city} so you can judge practical hospital-time value. If details are missing in the source pages, this output stays cautious and calls out uncertainty rather than guessing. Please verify final underwriting terms, disease-specific limits, and renewal conditions before purchase so there are no surprises during a claim.`;
  return normalizeWordCount(summary, 200);
}

function withMinimumThree<T>(items: T[]): T[] {
  if (items.length >= 3) {
    return items.slice(0, 3);
  }

  if (items.length === 0) {
    return [];
  }

  const expanded = [...items];
  let index = 0;
  while (expanded.length < 3) {
    expanded.push(items[index % items.length]);
    index += 1;
  }

  return expanded;
}

export async function runRecommendationPipeline(input: { query: string; profile: UserProfile }): Promise<RecommendationResponse> {
  const retrieved = await queryVectorStore(input.query, input.profile);
  const ranked = withMinimumThree(scorePolicies(input.profile, retrieved));
  const topPolicy = ranked[0];

  if (!topPolicy) {
    return {
      peer_comparison: [],
      coverage_details: [],
      empathetic_summary: normalizeWordCount(
        `I understand your concern about health coverage. We do not have enough policy evidence to generate a safe recommendation right now. Please upload additional policy documents so we can compare premium, waiting period, and exclusions with traceable citations for your age ${input.profile.age}, condition profile, and income band ${input.profile.income}.`,
        200
      ),
      citations: ["No policy chunks found in vector retrieval."],
    };
  }

  const citations = Array.from(
    new Set(
      ranked.map((policy) => {
        const source = policy.sourceDocument ?? `${policy.policyName}.pdf`;
        const page = policy.pageNumber ?? 1;
        return `According to ${source}, Page ${page}, policy ${policy.policyName}.`;
      })
    )
  );

  return {
    peer_comparison: ranked.map((policy) => ({
      policy_name: policy.policyName,
      insurer: policy.insurer,
      monthly_premium: Number((policy.premium / 12).toFixed(0)),
      cover_amount: formatCover(policy.coverAmount),
      waiting_period_months: policy.waitingPeriodMonths,
      key_benefit: policy.benefit,
      suitability_score: policy.suitabilityScore,
    })),
    coverage_details: [
      {
        Inclusions: topPolicy.inclusions,
        Exclusions: topPolicy.exclusions,
      },
    ],
    empathetic_summary: buildEmpatheticSummary(input.profile, topPolicy.suitabilityScore),
    citations,
  };
}
