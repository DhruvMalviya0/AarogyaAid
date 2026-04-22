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
  sourceDocument?: string;
  pageNumber?: number;
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
  policy_name: string;
  insurer: string;
  monthly_premium: number;
  cover_amount: string;
  waiting_period_months: number;
  key_benefit: string;
  suitability_score: number;
};

export type CoverageRow = {
  Inclusions: string[];
  Exclusions: string[];
};

export type RecommendationResponse = {
  peer_comparison: RecommendationRow[];
  coverage_details: CoverageRow[];
  empathetic_summary: string;
  citations: string[];
};
