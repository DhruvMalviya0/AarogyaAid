import { scorePolicies } from "@/lib/rag/matching";
import { queryVectorStore } from "@/lib/rag/vectorStore";
import { RecommendationResponse, UserProfile } from "@/lib/rag/types";

function formatInr(amount: number): string {
  return `INR ${amount.toLocaleString("en-IN")}/year`;
}

function formatCover(amount: number): string {
  if (amount >= 10000000) {
    return `INR ${(amount / 10000000).toFixed(1)}Cr`;
  }
  return `INR ${(amount / 100000).toFixed(0)}L`;
}

function buildWhyThisPolicy(profile: UserProfile): string {
  const conditionText = profile.conditions.join(", ");
  return `For age ${profile.age}, this recommendation prioritizes claim-time affordability and practical access based on your health conditions (${conditionText}) and income band ${profile.income}. The ranking places stronger weight on lower co-pay and shorter waiting period because these factors reduce out-of-pocket stress when treatment is needed. It also considers policy exclusions, local network suitability for ${profile.city}, and premium sustainability for your budget range. This patient-first logic aims to balance immediate affordability with better real-world claim utility.`;
}

export async function runRecommendationPipeline(input: { query: string; profile: UserProfile }): Promise<RecommendationResponse> {
  const retrieved = await queryVectorStore(input.query, input.profile);
  const ranked = scorePolicies(input.profile, retrieved).slice(0, 3);

  return {
    "Peer Comparison Table": ranked.map((policy) => ({
      "Policy Name": policy.policyName,
      Insurer: policy.insurer,
      Premium: formatInr(policy.premium),
      "Cover Amount": formatCover(policy.coverAmount),
      "Waiting Period": `${policy.waitingPeriodMonths} months`,
      Benefit: policy.benefit,
      "Suitability Score": policy.suitabilityScore,
    })),
    "Coverage Detail Table": ranked.map((policy) => ({
      Inclusions: policy.inclusions.join(", "),
      Exclusions: policy.exclusions.join(", "),
      "Sub-limits": policy.subLimits,
      "Co-pay": `${policy.coPayPercent}%`,
      "Claim type": policy.claimType,
    })),
    "Why This Policy": buildWhyThisPolicy(input.profile),
  };
}
