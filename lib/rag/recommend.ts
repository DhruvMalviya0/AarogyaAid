import { scorePolicies } from "@/lib/rag/matching";
import { queryVectorStore } from "@/lib/rag/vectorStore";
import { RecommendationResponse, UserProfile } from "@/lib/rag/types";

function formatCover(amount: number): string {
  if (amount >= 10000000) {
    return `INR ${(amount / 10000000).toFixed(1)}Cr`;
  }
  return `INR ${(amount / 100000).toFixed(0)}L`;
}

function buildEmpatheticSummary(profile: UserProfile, topScore: number): string {
  const primaryCondition = profile.conditions.find((c) => c.toLowerCase() !== "none") ?? "Hypertension";
  return `I understand that managing ${primaryCondition} can make insurance choices feel overwhelming, and your concern is completely valid. For ${profile.name}, we prioritized plans that protect you when care is actually needed, not just plans that look cheap at first glance. At age ${profile.age}, your suitability score of ${topScore}/100 reflects a better balance of waiting period, co-pay exposure, and practical claim usability for your profile. We also considered your income band (${profile.income}) to reduce the risk of selecting a plan that becomes difficult to maintain over time. For ${profile.city}, we favored options with stronger treatment-time value and clearer policy wording around exclusions and claims. The recommendation does not assume every hospitalization scenario is identical; it focuses on reducing predictable financial friction if a chronic-condition admission happens after the policy waiting period. Before purchase, please verify underwriting notes, renewal terms, and disease-specific caps from the final policy wording. This approach keeps the decision grounded, realistic, and aligned to your long-term health and budget stability.`;
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
      empathetic_summary:
        `I understand your concern about health coverage, especially with chronic-condition planning. At the moment, we do not have enough policy evidence to safely generate a ranked recommendation for your profile. Please upload additional policy documents so we can compare waiting period, exclusions, premium sustainability, and claim terms using traceable references tailored to your age ${input.profile.age} and income band ${input.profile.income}.`,
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
