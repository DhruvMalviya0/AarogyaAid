import { PolicyChunk, UserProfile } from "@/lib/rag/types";

function fallbackChunks(): PolicyChunk[] {
  return [
    {
      id: "chunk_1",
      policyId: "p1",
      policyName: "Aarogya Secure Plus",
      insurer: "SecureHealth",
      sourceDocument: "aarogya_secure_plus_2026.pdf",
      pageNumber: 4,
      content:
        "Clause 2.1: Pre-existing Hypertension is covered after a 24-month waiting period. Clause 5.2: Cosmetic surgery is excluded because it is elective and non-medical unless required after accidental injury.",
      premium: 18500,
      coverAmount: 1000000,
      waitingPeriodMonths: 24,
      coPayPercent: 10,
      exclusions: ["Cosmetic surgery (elective/non-medical)", "Non-prescribed wellness treatments"],
      inclusions: ["Hospitalization", "Day-care", "Pre/Post"],
      claimType: "Cashless + Reimbursement",
      subLimits: "Room rent 1 percent SI/day",
      benefit: "Lower claim burden for chronic conditions",
      cityTier: "tier_2",
    },
    {
      id: "chunk_2",
      policyId: "p2",
      policyName: "Care Shield Gold",
      insurer: "CareFirst",
      sourceDocument: "care_shield_gold_2026.pdf",
      pageNumber: 7,
      content:
        "Section 3.4: Hypertension cover starts after 30 months. Section 8.3: Cosmetic surgery is excluded unless reconstructive after accident. Strong metro hospital network is available.",
      premium: 16900,
      coverAmount: 800000,
      waitingPeriodMonths: 30,
      coPayPercent: 20,
      exclusions: ["Cosmetic surgery (except reconstructive)", "Consumables"],
      inclusions: ["Hospitalization", "Critical illness rider"],
      claimType: "Cashless",
      subLimits: "No disease-wise cap",
      benefit: "Strong metro network",
      cityTier: "metro",
    },
  ];
}

export async function queryVectorStore(query: string, profile: UserProfile): Promise<PolicyChunk[]> {
  const vectorStoreUrl = process.env.VECTOR_STORE_URL;

  if (!vectorStoreUrl) {
    return fallbackChunks();
  }

  const response = await fetch(`${vectorStoreUrl}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, profile }),
    cache: "no-store",
  });

  if (!response.ok) {
    return fallbackChunks();
  }

  const data = (await response.json()) as { matches: PolicyChunk[] };
  return data.matches ?? fallbackChunks();
}

// Tool required by chat orchestration: always use this for policy-grounded responses.
export async function retrieve_policy_chunks(query: string, profile: UserProfile): Promise<PolicyChunk[]> {
  return queryVectorStore(query, profile);
}

export async function deletePolicyChunksById(chunkIds: string[]): Promise<void> {
  const vectorStoreUrl = process.env.VECTOR_STORE_URL;
  if (!vectorStoreUrl) return;

  await fetch(`${vectorStoreUrl}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: chunkIds }),
    cache: "no-store",
  });
}
