# AarogyaAid AI
**Product Requirements Document**
*AI-Powered Insurance Recommendation Platform*

**Status:** MVP / Technical Assessment
**Author:** Dhruv Malviya

---

## 1. Executive Summary

AarogyaAid is an AI-driven platform designed to transform the confusing health insurance selection process into an empathetic, transparent, and patient-centric experience. By utilizing Retrieval-Augmented Generation (RAG), the platform provides grounded policy advice tailored to a user's specific health and financial profile.

---

## 2. User Profile & Pain Points

- **Primary User:** Indian individuals (Age 1–99) looking for reliable health coverage.
- **Health Literacy:** Low to Moderate; users are often intimidated by insurance jargon like "waiting periods" or "co-payments."
- **Key Fears:**
  - Hidden exclusions regarding pre-existing conditions.
  - Choosing an unaffordable premium that leads to policy lapse.
  - Lack of transparency in how a policy actually applies to their specific health situation.

---

## 3. Problem Statement

The current insurance landscape in India relies on clinical detachment and generic comparison tables. Users disclosing personal health conditions for the first time in a digital context require a warm, human-like guide that provides explainable logic rather than just a list of prices.

---

## 4. Feature Prioritization

Based on a 54-hour development timeline, features are prioritized to maximize the "Approach" and "Document Intelligence" scores.

| Priority | Feature | Rationale |
| :--- | :--- | :--- |
| **P0** | RAG-Powered Advisor | Core requirement for grounded, non-hallucinated advice. |
| **P0** | 6-Field Profile Form | Mandatory spec for capturing personalized user context. |
| **P0** | Structured Output | Comparison tables and "Why This Policy" summary are scored deliverables. |
| **P1** | Interactive Chat | Essential for jargon explanation and session-based follow-ups. |
| **P1** | Admin Knowledge Base | Required for dynamic policy updates without code changes. |

---

## 5. Recommendation & Matching Logic

The system evaluates a user's 6-field profile against uploaded policy documents using the following logic:

- **Medical Filter (Age & Conditions):** Prioritizes plans with the shortest waiting periods for the user's specific condition (e.g., Hypertension) and filters for age-eligible brackets.
- **Financial Guardrail (Income):** Sets a coverage target and ensures the premium does not exceed a reasonable affordability threshold based on the selected financial band.
- **Regional Optimization (City):** Ranks policies higher if they have strong network hospital presence or specific claim settlement advantages in the user's city tier.
- **Lifestyle Weighting (Activity Level):** Active/Athlete users are prioritized for policies with robust OPD (Out-Patient) or wellness benefits.

---

## 6. Constraints & Assumptions

- **Policy Data:** Policy documents are provided in text-searchable PDF, JSON, or TXT formats.
- **Grounding:** All factual policy data must originate from the RAG pipeline; the model must not use its own training data for insurance specifics.
- **Persistence:** User profile data must persist across the chat session to prevent repetitive questioning.

---

## 7. Out of Scope

- **Direct Medical Advice:** The agent is restricted to insurance coverage and will decline surgery/treatment recommendations.
- **Payment Gateway:** Actual premium collection and KYC processing are not part of this prototype.

---

> **Note to Reviewers:** This PRD was written prior to implementation to guide the architecture and logic of the AarogyaAid platform.