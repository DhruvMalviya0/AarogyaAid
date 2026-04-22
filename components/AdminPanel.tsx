"use client";

import { FormEvent, useEffect, useState } from "react";

type PolicyRow = {
  id: string;
  fileName: string;
  uploadDate: string;
  policyName: string;
  insurer: string;
  chunkIds: string[];
};

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    void loadPolicies();
  }, [authenticated]);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setError("Invalid credentials.");
      return;
    }

    setAuthenticated(true);
  }

  async function loadPolicies() {
    const response = await fetch("/api/admin/policies", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { policies: PolicyRow[] };
    setPolicies(data.policies ?? []);
  }

  async function onUpload(event: FormEvent) {
    event.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/upload-policy", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setFile(null);
      await loadPolicies();
    }
  }

  async function onDelete(policy: PolicyRow) {
    const confirmed = window.confirm(`Delete ${policy.policyName}? This action cannot be undone.`);
    if (!confirmed) return;

    const response = await fetch("/api/admin/delete-policy-chunks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyId: policy.id, chunkIds: policy.chunkIds }),
    });

    if (response.ok) {
      await loadPolicies();
    }
  }

  if (!authenticated) {
    return (
      <section className="mx-auto mt-16 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        <form className="mt-4 space-y-3" onSubmit={onLogin}>
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button className="w-full rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Login</button>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Policy Admin</h1>

      <form className="mt-4 flex items-center gap-3" onSubmit={onUpload}>
        <input type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
          Upload
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">File Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Upload Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Policy Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Insurer</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {policies.map((policy) => (
              <tr key={policy.id}>
                <td className="px-4 py-2 text-sm">{policy.fileName}</td>
                <td className="px-4 py-2 text-sm">{policy.uploadDate}</td>
                <td className="px-4 py-2 text-sm">{policy.policyName}</td>
                <td className="px-4 py-2 text-sm">{policy.insurer}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                    type="button"
                    onClick={() => void onDelete(policy)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
