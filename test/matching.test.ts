import { describe, expect, it } from "vitest";

import { scorePolicies } from "../lib/rag/matching";
import { PolicyChunk, UserProfile } from "../lib/rag/types";

describe("scorePolicies", () => {
  it("prioritizes low co-pay and short waiting period for high-risk profile", () => {
    const profile: UserProfile = {
      name: "Kavita",
      age: 44,
      lifestyle: "Sedentary",
      conditions: ["Diabetes", "Hypertension"],
      income: "3L-8L",
      city: "Indore",
    };

    const candidates: PolicyChunk[] = [
      {
        id: "a",
        policyId: "a",
        policyName: "Policy A",
        insurer: "Insurer A",
        content: "",
        premium: 19000,
        coverAmount: 1000000,
        waitingPeriodMonths: 24,
        coPayPercent: 10,
        exclusions: [],
        inclusions: [],
        claimType: "Cashless",
        subLimits: "NA",
        benefit: "Lower co-pay",
        cityTier: "tier_2",
      },
      {
        id: "b",
        policyId: "b",
        policyName: "Policy B",
        insurer: "Insurer B",
        content: "",
        premium: 17000,
        coverAmount: 1000000,
        waitingPeriodMonths: 36,
        coPayPercent: 25,
        exclusions: [],
        inclusions: [],
        claimType: "Cashless",
        subLimits: "NA",
        benefit: "Lower premium",
        cityTier: "tier_2",
      },
    ];

    const ranked = scorePolicies(profile, candidates);
    expect(ranked[0]?.policyName).toBe("Policy A");
    expect(ranked[0]?.suitabilityScore).toBeGreaterThan(ranked[1]?.suitabilityScore ?? 0);
  });
});
