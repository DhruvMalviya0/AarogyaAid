import React, { useEffect, useMemo, useState } from "react";

type LifestyleOption = "Sedentary" | "Moderately Active" | "Active";
type IncomeOption = "<3L" | "3L-8L" | "8L-15L" | ">15L";
type CityOption = "Mumbai" | "Delhi" | "Bengaluru" | "Pune" | "Indore" | "Jaipur";

type ProfileForm = {
  name: string;
  age: number | "";
  lifestyle: LifestyleOption | "";
  conditions: string[];
  income: IncomeOption | "";
  city: CityOption | "";
};

type PeerComparisonRow = {
  "Policy Name": string;
  Insurer: string;
  Premium: string;
  "Cover Amount": string;
  "Waiting Period": string;
  Benefit: string;
  "Suitability Score": number;
};

type CoverageDetailRow = {
  Inclusions: string;
  Exclusions: string;
  "Sub-limits": string;
  "Co-pay": string;
  "Claim type": string;
};

type RecommendationPayload = {
  "Peer Comparison Table": PeerComparisonRow[];
  "Coverage Detail Table": CoverageDetailRow[];
  "Why This Policy": string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Thyroid",
  "Cardiac History",
  "None",
];

const LIFESTYLES: LifestyleOption[] = ["Sedentary", "Moderately Active", "Active"];
const INCOME_OPTIONS: IncomeOption[] = ["<3L", "3L-8L", "8L-15L", ">15L"];
const CITY_OPTIONS: CityOption[] = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Indore", "Jaipur"];

const SESSION_KEY = "aarogyaaid.chat.session.v1";
const PROFILE_KEY = "aarogyaaid.profile.session.v1";

async function fetchRecommendations(profile: ProfileForm): Promise<RecommendationPayload> {
  // Replace this stub with your backend call.
  // Example:
  // const res = await fetch("/api/recommend", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(profile),
  // });
  // return res.json();

  return {
    "Peer Comparison Table": [
      {
        "Policy Name": "Aarogya Secure Plus",
        Insurer: "SecureHealth",
        Premium: "INR 18,500/year",
        "Cover Amount": "INR 10L",
        "Waiting Period": "24 months",
        Benefit: "Lower co-pay for chronic care",
        "Suitability Score": 89,
      },
      {
        "Policy Name": "Care Shield Gold",
        Insurer: "CareFirst",
        Premium: "INR 16,900/year",
        "Cover Amount": "INR 8L",
        "Waiting Period": "30 months",
        Benefit: "Large hospital network",
        "Suitability Score": 82,
      },
    ],
    "Coverage Detail Table": [
      {
        Inclusions: "Hospitalization, day-care, pre/post hospitalization",
        Exclusions: "Cosmetic procedures, non-medical consumables",
        "Sub-limits": "Room rent capped at 1 percent of SI/day",
        "Co-pay": "10 percent",
        "Claim type": "Cashless + Reimbursement",
      },
      {
        Inclusions: "Critical illness rider option",
        Exclusions: "Initial 30-day waiting except accidents",
        "Sub-limits": "No disease-wise cap on listed conditions",
        "Co-pay": "20 percent",
        "Claim type": "Cashless",
      },
    ],
    "Why This Policy": `For age ${profile.age}, the top recommendation balances affordability and chronic care readiness based on your stated conditions (${profile.conditions.join(
      ", "
    )}) and income band ${profile.income}. It prioritizes lower co-pay and shorter waiting period so claim-time stress is reduced.`,
  };
}

async function sendChatMessage(input: string, profile: ProfileForm): Promise<string> {
  // Replace this stub with your conversational endpoint.
  // Example:
  // const res = await fetch("/api/chat", { ... });
  // const data = await res.json();
  // return data.answer;

  return `I understand your concern. Based on age ${profile.age}, conditions ${profile.conditions.join(
    ", "
  )}, and income ${profile.income}, I can explain trade-offs in waiting period, co-pay, and network hospitals for ${profile.city}.`;
}

export default function HealthProfileAdvisor(): JSX.Element {
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    age: "",
    lifestyle: "",
    conditions: [],
    income: "",
    city: "",
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationPayload | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const savedMessages = sessionStorage.getItem(SESSION_KEY);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages) as ChatMessage[];
        setMessages(parsed);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }

    const savedProfile = sessionStorage.getItem(PROFILE_KEY);
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile) as ProfileForm;
        setForm(parsed);
      } catch {
        sessionStorage.removeItem(PROFILE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(form));
  }, [form]);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      typeof form.age === "number" &&
      Number.isInteger(form.age) &&
      form.age > 0 &&
      form.lifestyle !== "" &&
      form.conditions.length > 0 &&
      form.income !== "" &&
      form.city !== ""
    );
  }, [form]);

  const updateField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onConditionToggle = (condition: string) => {
    setForm((prev) => {
      const has = prev.conditions.includes(condition);
      if (condition === "None") {
        return { ...prev, conditions: has ? [] : ["None"] };
      }

      const withoutNone = prev.conditions.filter((c) => c !== "None");
      return {
        ...prev,
        conditions: has ? withoutNone.filter((c) => c !== condition) : [...withoutNone, condition],
      };
    });
  };

  const validate = (): string[] => {
    const nextErrors: string[] = [];

    if (!form.name.trim()) nextErrors.push("Name is required.");
    if (!(typeof form.age === "number" && Number.isInteger(form.age) && form.age > 0)) {
      nextErrors.push("Age must be a valid positive integer.");
    }
    if (!form.lifestyle) nextErrors.push("Lifestyle is required.");
    if (form.conditions.length === 0) nextErrors.push("Select at least one condition.");
    if (!form.income) nextErrors.push("Income is required.");
    if (!form.city) nextErrors.push("City is required.");

    return nextErrors;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (validation.length > 0) return;

    setLoading(true);
    try {
      const response = await fetchRecommendations(form);
      setRecommendations(response);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I have generated recommendation tables. Ask me anything about trade-offs, waiting periods, or co-pay.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: chatInput.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const reply = await sendChatMessage(userMsg.content, form);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>AarogyaAid Health Profile</h1>

      <form style={styles.form} onSubmit={onSubmit}>
        <label style={styles.label}>
          Name
          <input
            style={styles.input}
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Enter full name"
          />
        </label>

        <label style={styles.label}>
          Age (int)
          <input
            style={styles.input}
            type="number"
            min={0}
            step={1}
            value={form.age}
            onChange={(e) => {
              const raw = e.target.value;
              updateField("age", raw === "" ? "" : Number.parseInt(raw, 10));
            }}
            placeholder="Enter age"
          />
        </label>

        <label style={styles.label}>
          Lifestyle (dropdown)
          <select
            style={styles.input}
            value={form.lifestyle}
            onChange={(e) => updateField("lifestyle", e.target.value as LifestyleOption)}
          >
            <option value="">Select lifestyle</option>
            {LIFESTYLES.map((lifestyle) => (
              <option key={lifestyle} value={lifestyle}>
                {lifestyle}
              </option>
            ))}
          </select>
        </label>

        <fieldset style={styles.fieldset}>
          <legend style={styles.legend}>Conditions (multi-select)</legend>
          <div style={styles.conditionGrid}>
            {CONDITIONS.map((condition) => (
              <label key={condition} style={styles.checkLabel}>
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

        <label style={styles.label}>
          Income (dropdown)
          <select
            style={styles.input}
            value={form.income}
            onChange={(e) => updateField("income", e.target.value as IncomeOption)}
          >
            <option value="">Select income band</option>
            {INCOME_OPTIONS.map((income) => (
              <option key={income} value={income}>
                {income}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.label}>
          City (dropdown)
          <select style={styles.input} value={form.city} onChange={(e) => updateField("city", e.target.value as CityOption)}>
            <option value="">Select city</option>
            {CITY_OPTIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        {errors.length > 0 && (
          <ul style={styles.errorList}>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        <button style={styles.button} type="submit" disabled={!canSubmit || loading}>
          {loading ? "Generating..." : "Get Recommendations"}
        </button>
      </form>

      {recommendations && (
        <section style={styles.resultsSection}>
          <h2 style={styles.subheading}>Peer Comparison Table</h2>
          <Table
            headers={[
              "Policy Name",
              "Insurer",
              "Premium",
              "Cover Amount",
              "Waiting Period",
              "Benefit",
              "Suitability Score",
            ]}
            rows={recommendations["Peer Comparison Table"].map((row) => [
              row["Policy Name"],
              row["Insurer"],
              row["Premium"],
              row["Cover Amount"],
              row["Waiting Period"],
              row["Benefit"],
              String(row["Suitability Score"]),
            ])}
          />

          <h2 style={styles.subheading}>Coverage Detail Table</h2>
          <Table
            headers={["Inclusions", "Exclusions", "Sub-limits", "Co-pay", "Claim type"]}
            rows={recommendations["Coverage Detail Table"].map((row) => [
              row["Inclusions"],
              row["Exclusions"],
              row["Sub-limits"],
              row["Co-pay"],
              row["Claim type"],
            ])}
          />

          <h2 style={styles.subheading}>Why This Policy</h2>
          <p style={styles.why}>{recommendations["Why This Policy"]}</p>
        </section>
      )}

      <section style={styles.chatSection}>
        <h2 style={styles.subheading}>Interactive Chat</h2>
        <div style={styles.chatWindow}>
          {messages.length === 0 ? (
            <p style={styles.emptyChat}>Session memory is active. Your chat will persist for this browser session.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.bubble,
                  ...(msg.role === "user" ? styles.userBubble : styles.assistantBubble),
                }}
              >
                <strong>{msg.role === "user" ? "You" : "Advisor"}:</strong> {msg.content}
              </div>
            ))
          )}
        </div>

        <form style={styles.chatForm} onSubmit={onSendChat}>
          <input
            style={styles.chatInput}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about waiting period, co-pay, exclusions..."
          />
          <button style={styles.button} type="submit" disabled={chatLoading}>
            {chatLoading ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }): JSX.Element {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={styles.th}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`} style={styles.td}>
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Segoe UI, sans-serif",
    color: "#1f2937",
  },
  heading: {
    marginBottom: "12px",
  },
  subheading: {
    marginTop: "16px",
    marginBottom: "8px",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "12px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 14,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 14,
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 14,
    background: "#ffffff",
  },
  fieldset: {
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: 10,
    margin: 0,
    gridColumn: "1 / -1",
  },
  legend: {
    fontSize: 14,
    fontWeight: 600,
    padding: "0 6px",
  },
  conditionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 8,
  },
  checkLabel: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    fontSize: 14,
  },
  button: {
    border: "none",
    borderRadius: 8,
    background: "#0f766e",
    color: "#ffffff",
    fontWeight: 600,
    padding: "10px 12px",
    cursor: "pointer",
    alignSelf: "end",
    minHeight: 40,
  },
  errorList: {
    margin: 0,
    color: "#b91c1c",
    fontSize: 13,
    gridColumn: "1 / -1",
  },
  resultsSection: {
    marginTop: 22,
    padding: 14,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 760,
  },
  th: {
    textAlign: "left",
    background: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
    padding: "10px 8px",
    fontSize: 13,
  },
  td: {
    borderBottom: "1px solid #e2e8f0",
    padding: "10px 8px",
    fontSize: 13,
    verticalAlign: "top",
  },
  why: {
    lineHeight: 1.6,
    margin: 0,
  },
  chatSection: {
    marginTop: 22,
    padding: 14,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  chatWindow: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    borderRadius: 8,
    minHeight: 180,
    maxHeight: 320,
    overflowY: "auto",
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  bubble: {
    maxWidth: "90%",
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.4,
  },
  userBubble: {
    marginLeft: "auto",
    background: "#ccfbf1",
    border: "1px solid #5eead4",
  },
  assistantBubble: {
    marginRight: "auto",
    background: "#e0f2fe",
    border: "1px solid #7dd3fc",
  },
  emptyChat: {
    margin: 0,
    color: "#475569",
    fontSize: 14,
  },
  chatForm: {
    marginTop: 10,
    display: "flex",
    gap: 8,
  },
  chatInput: {
    flex: 1,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    background: "#ffffff",
  },
};
