"use client";

import { FormEvent, useMemo, useState } from "react";

import { useSessionChat } from "@/hooks/useSessionChat";

type LifestyleOption = "Sedentary" | "Moderately Active" | "Active";
type IncomeOption = "<3L" | "3L-8L" | "8L-15L" | ">15L";

type ProfileForm = {
  name: string;
  age: number | "";
  lifestyle: LifestyleOption | "";
  conditions: string[];
  income: IncomeOption | "";
  city: string;
};

type RecommendationPayload = {
  peer_comparison: Array<{
    policy_name: string;
    insurer: string;
    monthly_premium: number;
    cover_amount: string;
    waiting_period_months: number;
    key_benefit: string;
    suitability_score: number;
  }>;
  coverage_details: Array<{
    Inclusions: string[];
    Exclusions: string[];
  }>;
  empathetic_summary: string;
  citations: string[];
};

const CONDITIONS = ["Diabetes", "Hypertension", "Asthma", "Thyroid", "Cardiac History", "None"];

export default function HealthProfileAdvisor() {
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    age: "",
    lifestyle: "",
    conditions: [],
    income: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [result, setResult] = useState<RecommendationPayload | null>(null);

  const { messages, append, clear } = useSessionChat();

  const canSubmit = useMemo(
    () =>
      form.name.trim().length > 0 &&
      typeof form.age === "number" &&
      form.age > 0 &&
      form.lifestyle !== "" &&
      form.conditions.length > 0 &&
      form.income !== "" &&
      form.city.trim().length > 0,
    [form]
  );

  const onConditionToggle = (value: string) => {
    setForm((prev) => {
      const exists = prev.conditions.includes(value);
      if (value === "None") {
        return { ...prev, conditions: exists ? [] : ["None"] };
      }

      const withoutNone = prev.conditions.filter((c) => c !== "None");
      return {
        ...prev,
        conditions: exists ? withoutNone.filter((c) => c !== value) : [...withoutNone, value],
      };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "Recommend the best patient-first health policies",
          profile: {
            name: form.name,
            age: Number(form.age),
            lifestyle: form.lifestyle,
            conditions: form.conditions,
            income: form.income,
            city: form.city,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Recommendation API failed");
      }

      const data = (await response.json()) as RecommendationPayload;
      setResult(data);
      append({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Recommendations are ready. Ask me about waiting period or co-pay trade-offs.",
        createdAt: new Date().toISOString(),
      });
    } catch {
      setError("Could not fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = (event: FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim()) return;

    append({
      id: crypto.randomUUID(),
      role: "user",
      content: chatInput.trim(),
      createdAt: new Date().toISOString(),
    });

    const topPolicy = result?.peer_comparison[0];
    const normalizedQuestion = chatInput.trim().toLowerCase();
    let assistantReply =
      "I can explain exclusions, co-pay, waiting periods, and city network fit based on your profile and cited policy pages.";

    if (topPolicy && (normalizedQuestion.includes("why") || normalizedQuestion.includes("score"))) {
      assistantReply = `Because at your age of ${form.age}, your income band ${form.income}, and your condition profile (${form.conditions.join(
        ", "
      )}), ${topPolicy.policy_name} scored ${topPolicy.suitability_score}/100 with a lower waiting period (${topPolicy.waiting_period_months} months) and stronger claim-time affordability.`;
    }

    if (normalizedQuestion.includes("dental")) {
      const detail = result?.coverage_details[0];
      const includesDental =
        !!detail &&
        ([...detail.Inclusions, ...detail.Exclusions].join(" ").toLowerCase().includes("dental"));

      if (!includesDental) {
        assistantReply = `The provided documents for ${topPolicy?.policy_name ?? "the recommended policy"} do not specify dental coverage.`;
      }
    }

    append({
      id: crypto.randomUUID(),
      role: "assistant",
      content: assistantReply,
      createdAt: new Date().toISOString(),
    });

    setChatInput("");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">AarogyaAid Health Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Patient-first recommendations with transparent trade-offs.</p>

        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />

          <Input
            label="Age (int)"
            type="number"
            value={String(form.age)}
            onChange={(v) => setForm((p) => ({ ...p, age: v ? Number.parseInt(v, 10) : "" }))}
          />

          <Select
            label="Lifestyle (dropdown)"
            value={form.lifestyle}
            options={["Sedentary", "Moderately Active", "Active"]}
            onChange={(v) => setForm((p) => ({ ...p, lifestyle: v as LifestyleOption }))}
          />

          <Select
            label="Income (dropdown)"
            value={form.income}
            options={["<3L", "3L-8L", "8L-15L", ">15L"]}
            onChange={(v) => setForm((p) => ({ ...p, income: v as IncomeOption }))}
          />

          <Input label="City (dropdown)" value={form.city} onChange={(v) => setForm((p) => ({ ...p, city: v }))} />

          <fieldset className="rounded-lg border border-slate-200 p-3 md:col-span-2">
            <legend className="px-1 text-sm font-medium text-slate-700">Conditions (multi-select)</legend>
            <div className="grid gap-2 md:grid-cols-3">
              {CONDITIONS.map((condition) => (
                <label key={condition} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.conditions.includes(condition)}
                    onChange={() => onConditionToggle(condition)}
                  />
                  {condition}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Generating..." : "Get Recommendations"}
            </button>

            {error ? <span className="text-sm text-rose-700">{error}</span> : null}
          </div>
        </form>
      </section>

      {result ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Recommendation</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            <strong>{form.name}</strong>, based on your condition profile ({form.conditions.join(", ")}), the recommended policy is
            <strong> {result.peer_comparison[0]?.policy_name}</strong> with a suitability score of
            <strong> {result.peer_comparison[0]?.suitability_score}/100</strong>.
          </p>

          <h3 className="mt-5 text-lg font-semibold text-slate-900">Feature Comparison (Top 2)</h3>
          <Table
            headers={[
              "Feature",
              `Recommended: ${result.peer_comparison[0]?.policy_name ?? "N/A"}`,
              `Alternative: ${result.peer_comparison[1]?.policy_name ?? "N/A"}`,
            ]}
            rows={[
              [
                "Monthly Premium",
                `INR ${result.peer_comparison[0]?.monthly_premium ?? "N/A"}`,
                `INR ${result.peer_comparison[1]?.monthly_premium ?? "N/A"}`,
              ],
              [
                "Waiting Period",
                `${result.peer_comparison[0]?.waiting_period_months ?? "N/A"} months`,
                `${result.peer_comparison[1]?.waiting_period_months ?? "N/A"} months`,
              ],
              [
                "Suitability",
                `${result.peer_comparison[0]?.suitability_score ?? "N/A"}/100`,
                `${result.peer_comparison[1]?.suitability_score ?? "N/A"}/100`,
              ],
            ]}
          />

          <h2 className="mt-5 text-xl font-semibold text-slate-900">Peer Comparison (Evidence)</h2>
          <Table
            headers={["Policy Name", "Insurer", "Premium", "Cover Amount", "Waiting Period", "Benefit", "Suitability Score"]}
            rows={result.peer_comparison.map((row) => [
              row.policy_name,
              row.insurer,
              `INR ${row.monthly_premium}`,
              row.cover_amount,
              `${row.waiting_period_months} months`,
              row.key_benefit,
              String(row.suitability_score),
            ])}
          />

          <h2 className="mt-5 text-xl font-semibold text-slate-900">Coverage Details (Top Policy)</h2>
          <Table
            headers={["Inclusions", "Exclusions"]}
            rows={result.coverage_details.map((row) => [
              row.Inclusions.join(", "),
              row.Exclusions.join(", "),
            ])}
          />

          <h2 className="mt-5 text-xl font-semibold text-slate-900">Empathetic Summary</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{result.empathetic_summary}</p>

          <h2 className="mt-5 text-xl font-semibold text-slate-900">Citations (Proof)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {result.citations.map((citation) => (
              <li key={citation}>{citation}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Interactive Chat</h2>
          <button type="button" onClick={clear} className="text-sm text-slate-500 hover:text-slate-800">
            Clear Session
          </button>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-600">Session memory is active. Messages persist for this browser session.</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === "user" ? "ml-8 bg-teal-50 text-slate-800" : "mr-8 bg-sky-50 text-slate-800"
                }`}
              >
                <strong>{message.role === "user" ? "You" : "Advisor"}: </strong>
                {message.content}
              </div>
            ))
          )}
        </div>

        <form className="mt-3 flex gap-2" onSubmit={handleChatSend}>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Ask about co-pay, waiting period, exclusions..."
          />
          <button type="submit" className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}

function Input(props: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      <span className="mb-1 block">{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
      />
    </label>
  );
}

function Select(props: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      <span className="mb-1 block">{props.label}</span>
      <select
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
      >
        <option value="">Select</option>
        {props.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row, index) => (
            <tr key={`${index}-${row[0]}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} className="px-3 py-2 text-sm text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
