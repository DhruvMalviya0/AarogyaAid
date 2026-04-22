import { PolicyChunk, UserProfile } from "@/lib/rag/types";

type RiskTier = "high" | "moderate" | "low";

function inferRiskTier(profile: UserProfile): RiskTier {
  const conditionCount = profile.conditions.filter((c) => c.toLowerCase() !== "none").length;
  if ((profile.age >= 40 && conditionCount >= 1) || conditionCount >= 2) {
    return "high";
  }
  if (conditionCount === 1 || profile.lifestyle === "Sedentary") {
    return "moderate";
  }
  return "low";
}

function normalizeScore(value: number, best: number, worst: number): number {
  if (best === worst) return 100;
  const normalized = ((worst - value) / (worst - best)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

const weights: Record<RiskTier, { copay: number; waiting: number; premium: number; benefit: number }> = {
  high: { copay: 0.4, waiting: 0.35, premium: 0.1, benefit: 0.15 },
  moderate: { copay: 0.3, waiting: 0.3, premium: 0.2, benefit: 0.2 },
  low: { copay: 0.15, waiting: 0.15, premium: 0.45, benefit: 0.25 },
};

export function scorePolicies(profile: UserProfile, policies: PolicyChunk[]) {
  const tier = inferRiskTier(profile);
  const selectedWeights = weights[tier];

  const coPays = policies.map((p) => p.coPayPercent);
  const waiting = policies.map((p) => p.waitingPeriodMonths);
  const premiums = policies.map((p) => p.premium);

  const minCoPay = Math.min(...coPays);
  const maxCoPay = Math.max(...coPays);
  const minWaiting = Math.min(...waiting);
  const maxWaiting = Math.max(...waiting);
  const minPremium = Math.min(...premiums);
  const maxPremium = Math.max(...premiums);

  return policies
    .map((policy) => {
      const coPayScore = normalizeScore(policy.coPayPercent, minCoPay, maxCoPay);
      const waitingScore = normalizeScore(policy.waitingPeriodMonths, minWaiting, maxWaiting);
      const premiumScore = normalizeScore(policy.premium, minPremium, maxPremium);
      const benefitScore = Math.min(100, Math.max(0, policy.benefit.length * 2));

      const weightedScore =
        coPayScore * selectedWeights.copay +
        waitingScore * selectedWeights.waiting +
        premiumScore * selectedWeights.premium +
        benefitScore * selectedWeights.benefit;

      return {
        ...policy,
        suitabilityScore: Number(weightedScore.toFixed(2)),
        riskTier: tier,
      };
    })
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}
