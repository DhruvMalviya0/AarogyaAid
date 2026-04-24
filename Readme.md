# AarogyaAid: AI-Powered Insurance Recommendation Platform

AarogyaAid is a patient-centric platform utilizing a grounded AI agent to provide empathetic, transparent, and explainable health insurance advice. This project is a technical assessment for the AI Engineering role, focusing on RAG-driven policy matching.

## 🚀 Setup Instructions

### 1. Prerequisites
* [cite_start]**Node.js** (v18+) and **npm** [cite: 82]
* [cite_start]**OpenAI API Key** for the LLM [cite: 82]
* [cite_start]**Supabase Project** for Vector Storage and PostgreSQL [cite: 82]

### 2. Environment Configuration
Create a `.env` file in the root directory (refer to `.env.example`). [cite_start]**Never commit your actual .env file.** [cite: 98, 124]
```text
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

### 3. Installation & Local Development
```bash
# Clone and setup in one go
git clone https://github.com/DhruvMalviya0/AarogyaAid.git
cd AarogyaAid
npm install
cp .env.example .env.local
# NOTE: User must fill .env.local with their own keys at this point
npm run dev
```
[cite_start]Access the application at `http://localhost:3000`. [cite: 100]

---

## 🛠️ Technical Decisions & Justifications

### AI Framework: Vercel AI SDK (Next.js)
[cite_start]While Google ADK was suggested, I chose the **Vercel AI SDK** with Next.js. [cite: 82, 85]
* [cite_start]**Justification:** For a 54-hour sprint, the Vercel AI SDK provides superior "First-Class" React integration through the `useChat` hook. [cite: 82, 399] [cite_start]This ensures stable streaming of LLM responses and seamless session memory management, allowing the agent to remember user profiles across chat turns without re-asking. [cite: 68, 94]

### Document Intelligence & RAG Pipeline
* [cite_start]**Vector Store:** **Supabase (pgvector)** was selected because it supports the hard requirement of **immediate document deletion** via the `service_role` key. [cite: 75, 82, 239]
* [cite_start]**Chunking Strategy:** I utilized **Fixed-size chunking** (500 tokens with a 10% overlap). [cite: 242]
    * [cite_start]**Rationale:** This strategy ensures dense insurance tables (like sub-limits and co-pay clauses) are captured across overlapping chunks, preventing critical data loss during retrieval. [cite: 309]
* [cite_start]**Grounding:** The agent uses a custom `retrieve_policy_chunks` tool. [cite: 91, 266] [cite_start]It is strictly forbidden from using training knowledge, ensuring all output is sourced directly from uploaded PDFs. [cite: 63, 93, 243]

---

## 🧠 Recommendation Matching Logic
[cite_start]The system evaluates the **6-field user profile** using a weighted algorithm: [cite: 47, 52]
1. [cite_start]**Health Compatibility (40%):** Matches "Pre-existing Conditions" against policy "Waiting Periods" and "Exclusions". [cite: 51, 195, 207]
2. [cite_start]**Financial Threshold (30%):** Cross-references "Annual Income" with premiums and "Co-pay %" to ensure affordability. [cite: 51, 207]
3. [cite_start]**Regional Relevance (20%):** Prioritizes insurers with strong network hospital presence in the user's "City Tier". [cite: 51]
4. [cite_start]**Lifestyle Adjustment (10%):** Boosts suitability for active users if the policy includes OPD or wellness benefits. [cite: 51]

---

## 🔒 Admin Panel & Security
[cite_start]The Admin Panel is secured via environment-variable-driven authentication. [cite: 76, 326]
* [cite_start]**Knowledge Management:** Admins can upload PDF, JSON, or TXT policies. [cite: 72, 329]
* [cite_start]**Immediate Purge:** Deleting a document removes it from the vector store instantly, ensuring the AI agent's knowledge remains current. [cite: 75, 327]

---

## 📂 Project Structure
* [cite_start]`/app`: Next.js App Router (Frontend and API Routes) [cite: 24]
* [cite_start]`/components`: UI components (Profile Form, Comparison Tables, Chat) [cite: 24, 117]
* [cite_start]`/lib`: AI Agent configuration, tool definitions, and RAG logic [cite: 24, 365]
* [cite_start]`/tests`: Unit tests for recommendation logic [cite: 101, 343]
* [cite_start]`/public/samples`: 3+ sample policy documents for testing [cite: 27, 352]

---
**AarogyaAid Engineering Assessment Submission**