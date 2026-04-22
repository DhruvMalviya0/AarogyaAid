"""
Insurance RAG starter module (LangChain + ChromaDB).

What this file includes:
1) ChromaDB vector store setup with deletion by document ID.
2) A LangChain tool: retrieve_policy_chunks(query, user_profile).
3) A system prompt for an Empathetic Insurance Advisor.

Install dependencies:
    pip install langchain langchain-core langchain-openai langchain-chroma chromadb pydantic

Set environment variables (example for OpenAI embeddings):
    OPENAI_API_KEY=...
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from langchain.tools import tool
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from pydantic import BaseModel, Field


@dataclass
class InsuranceRAGConfig:
    persist_directory: str = "./chroma_insurance"
    collection_name: str = "insurance_policies"
    top_k: int = 5


class InsuranceRAG:
    """Thin wrapper around ChromaDB for insurance policy retrieval."""

    def __init__(self, config: InsuranceRAGConfig):
        self.config = config
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.vectorstore = Chroma(
            collection_name=config.collection_name,
            persist_directory=config.persist_directory,
            embedding_function=self.embeddings,
        )

    def add_policy_chunks(
        self,
        chunks: list[str],
        ids: list[str],
        metadatas: list[dict[str, Any]] | None = None,
    ) -> None:
        if len(chunks) != len(ids):
            raise ValueError("chunks and ids must have the same length")
        if metadatas is not None and len(metadatas) != len(chunks):
            raise ValueError("metadatas length must match chunks length")

        self.vectorstore.add_texts(texts=chunks, ids=ids, metadatas=metadatas)

    def delete_policy_chunks_by_id(self, ids: list[str]) -> None:
        """Deletes vector records by exact IDs."""
        if not ids:
            return
        self.vectorstore.delete(ids=ids)

    def _build_filter(self, user_profile: dict[str, Any]) -> dict[str, Any] | None:
        """
        Build metadata filter for retrieval.

        Suggested metadata keys while indexing documents:
        - city_tier: metro | tier_2 | tier_3
        - city: city name
        - condition_tags: list[str]
        - min_age: int
        - max_age: int
        """
        if not user_profile:
            return None

        filters: list[dict[str, Any]] = []

        city = user_profile.get("city")
        if city:
            filters.append({"city": {"$eq": city.lower()}})

        # Example: match on explicit condition tag if provided.
        conditions = user_profile.get("pre_existing_conditions", [])
        if isinstance(conditions, list) and conditions:
            # Chroma supports metadata filtering, but list operators vary by setup.
            # We store a normalized primary condition for robust filtering.
            primary_condition = str(conditions[0]).strip().lower()
            filters.append({"primary_condition": {"$eq": primary_condition}})

        if not filters:
            return None

        if len(filters) == 1:
            return filters[0]

        return {"$and": filters}

    def retrieve(self, query: str, user_profile: dict[str, Any], k: int | None = None) -> list[Document]:
        k = k or self.config.top_k
        metadata_filter = self._build_filter(user_profile)

        return self.vectorstore.similarity_search(
            query=query,
            k=k,
            filter=metadata_filter,
        )


class RetrievePolicyChunksInput(BaseModel):
    query: str = Field(..., description="User insurance question")
    user_profile: dict[str, Any] = Field(
        ..., description="Profile with name, age, lifestyle, pre_existing_conditions, income, city"
    )


class PeerComparisonRow(BaseModel):
    """One row in the peer comparison table with exactly 7 required columns."""

    policy_name: str = Field(..., alias="Policy Name")
    insurer: str = Field(..., alias="Insurer")
    premium: str | float = Field(..., alias="Premium")
    cover_amount: str | float = Field(..., alias="Cover Amount")
    waiting_period: str = Field(..., alias="Waiting Period")
    benefit: str = Field(..., alias="Benefit")
    suitability_score: float = Field(..., alias="Suitability Score", ge=0.0, le=100.0)

    model_config = {
        "populate_by_name": True,
        "extra": "forbid",
    }


class CoverageDetailRow(BaseModel):
    """One row in the coverage detail table."""

    inclusions: str = Field(..., alias="Inclusions")
    exclusions: str = Field(..., alias="Exclusions")
    sub_limits: str = Field(..., alias="Sub-limits")
    co_pay: str = Field(..., alias="Co-pay")
    claim_type: str = Field(..., alias="Claim type")

    model_config = {
        "populate_by_name": True,
        "extra": "forbid",
    }


class InsuranceAdvisorOutput(BaseModel):
    """Structured output expected from the insurance advisor agent."""

    peer_comparison_table: list[PeerComparisonRow] = Field(..., alias="Peer Comparison Table", min_length=1)
    coverage_detail_table: list[CoverageDetailRow] = Field(..., alias="Coverage Detail Table", min_length=1)
    why_this_policy: str = Field(..., alias="Why This Policy")

    model_config = {
        "populate_by_name": True,
        "extra": "forbid",
    }


# JSON schema you can pass to your LLM output parser / response format config.
INSURANCE_ADVISOR_OUTPUT_JSON_SCHEMA: dict[str, Any] = InsuranceAdvisorOutput.model_json_schema(by_alias=True)


def _word_count(text: str) -> int:
    return len(text.split())


def parse_insurance_advisor_output(raw_output: str | dict[str, Any], user_profile: dict[str, Any]) -> dict[str, Any]:
    """
    Parse and validate model output for AarogyaAid advisor.

    Enforces:
    - Required table structures and columns.
    - "Why This Policy" must be exactly 200 words.
    - "Why This Policy" must explicitly mention user's age, at least one condition, and income.

    Returns validated output as a dict using required alias keys.
    """
    payload: dict[str, Any]
    if isinstance(raw_output, str):
        try:
            payload = json.loads(raw_output)
        except json.JSONDecodeError as exc:
            raise ValueError("Agent output is not valid JSON") from exc
    elif isinstance(raw_output, dict):
        payload = raw_output
    else:
        raise TypeError("raw_output must be either a JSON string or dict")

    validated = InsuranceAdvisorOutput.model_validate(payload)
    result = validated.model_dump(by_alias=True)

    why_text = result["Why This Policy"]
    words = _word_count(why_text)
    if words != 200:
        raise ValueError(f'"Why This Policy" must be exactly 200 words, found {words}')

    age = user_profile.get("age")
    if age is not None and str(age) not in why_text:
        raise ValueError('"Why This Policy" must explicitly mention the user\'s Age')

    conditions = user_profile.get("pre_existing_conditions", [])
    if conditions:
        normalized = why_text.lower()
        if not any(str(condition).strip().lower() in normalized for condition in conditions):
            raise ValueError('"Why This Policy" must explicitly mention at least one user Condition')

    income = user_profile.get("income")
    if income is not None:
        income_str = str(income)
        income_comma = f"{income:,}" if isinstance(income, (int, float)) else income_str
        if income_str not in why_text and income_comma not in why_text:
            raise ValueError('"Why This Policy" must explicitly mention the user\'s Income')

    return result


rag = InsuranceRAG(InsuranceRAGConfig())


@tool("retrieve_policy_chunks", args_schema=RetrievePolicyChunksInput)
def retrieve_policy_chunks(query: str, user_profile: dict[str, Any]) -> str:
    """
    Retrieve relevant insurance policy chunks for a user query and profile.

    Returns a JSON string to make tool output easy for downstream agents to parse.
    """
    docs = rag.retrieve(query=query, user_profile=user_profile)

    payload = []
    for doc in docs:
        payload.append(
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
            }
        )

    return json.dumps(payload, ensure_ascii=True)


EMPATHETIC_INSURANCE_ADVISOR_SYSTEM_PROMPT = """
You are AarogyaAid's Empathetic Insurance Advisor.

Core behavior rules:
1. Always acknowledge the user's health conditions and emotional concern first, in one clear sentence.
2. Never provide medical advice, diagnosis, or treatment guidance.
3. Stay within insurance education and policy comparison support.
4. For every recommendation, cite evidence from retrieved policy chunks.
5. If evidence is missing, say you are uncertain and ask a focused follow-up question.
6. Avoid absolute guarantees (for example: "this will be covered"). Use conditional phrasing.

Response policy:
- Start with empathy: recognize chronic illness burden and premium anxiety.
- Then provide a structured answer with:
  a) Best-fit options (if available)
  b) Trade-offs (co-pay, waiting period, exclusions, premium)
  c) What to verify before purchase
- Keep language simple, patient-first, and non-judgmental.

Required safety boundary:
- If asked for medical guidance, politely refuse and redirect to a licensed clinician.
- Continue helping with insurance implications only.

Citation format:
- Add a "Sources" section at the end.
- Cite each claim with source metadata when available, using this style:
  [source: <policy_name>, section: <section_name>, chunk_id: <id>]
""".strip()


if __name__ == "__main__":
    # Minimal smoke example (replace with your own chunks and IDs)
    sample_chunks = [
        "Plan A: Co-pay 10 percent. PED waiting period 24 months. Covers diabetes after waiting period.",
        "Plan B: Co-pay 20 percent. PED waiting period 36 months. Wider metro network.",
    ]
    sample_ids = ["plan_a_chunk_1", "plan_b_chunk_1"]
    sample_metadata = [
        {"policy_name": "Plan A", "section_name": "Coverage", "city": "indore", "primary_condition": "diabetes"},
        {"policy_name": "Plan B", "section_name": "Coverage", "city": "mumbai", "primary_condition": "diabetes"},
    ]

    rag.add_policy_chunks(sample_chunks, sample_ids, sample_metadata)

    user_profile = {
        "name": "Kavita Sharma",
        "age": 42,
        "lifestyle": "sedentary",
        "pre_existing_conditions": ["diabetes", "hypertension"],
        "income": 850000,
        "city": "indore",
    }

    print(retrieve_policy_chunks.invoke({"query": "low copay options for diabetes", "user_profile": user_profile}))

    # Deletion by ID example
    rag.delete_policy_chunks_by_id(["plan_b_chunk_1"])
