export type Lifestyle = "Sedentary" | "Moderately Active" | "Active";

export type UserProfile = {
  name: string;
  age: number;
  lifestyle: Lifestyle;
  conditions: string[];
  income: string;
  city: string;
};

export type PolicyChunk = {
  id: string;
  policyId: string;
  policyName: string;
  insurer: string;
  content: string;
  premium: number;
  coverAmount: number;
  waitingPeriodMonths: number;
  coPayPercent: number;
  exclusions: string[];
  inclusions: string[];
  claimType: string;
  subLimits: string;
  benefit: string;
  cityTier: "metro" | "tier_2" | "tier_3";
};

export type RecommendationRow = {
  "Policy Name": string;
  Insurer: string;
  Premium: string;
  "Cover Amount": string;
  "Waiting Period": string;
  Benefit: string;
  "Suitability Score": number;
};

export type CoverageRow = {
  Inclusions: string;
  Exclusions: string;
  "Sub-limits": string;
  "Co-pay": string;
  "Claim type": string;
};

export type RecommendationResponse = {
  "Peer Comparison Table": RecommendationRow[];
  "Coverage Detail Table": CoverageRow[];
  "Why This Policy": string;
};
