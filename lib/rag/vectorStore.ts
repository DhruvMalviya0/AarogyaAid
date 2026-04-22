import { PolicyChunk, UserProfile } from "@/lib/rag/types";

function fallbackChunks(): PolicyChunk[] {
  return [
    {
      id: "chunk_1",
      policyId: "p1",
      policyName: "Aarogya Secure Plus",
      insurer: "SecureHealth",
      content: "Low co-pay and lower PED waiting period.",
      premium: 18500,
      coverAmount: 1000000,
      waitingPeriodMonths: 24,
      coPayPercent: 10,
      exclusions: ["Cosmetic procedures"],
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
      content: "Wide metro network with mid-level premium.",
      premium: 16900,
      coverAmount: 800000,
      waitingPeriodMonths: 30,
      coPayPercent: 20,
      exclusions: ["Consumables"],
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
