"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PolicyRow = {
  id: string;
  fileName: string;
  uploadDate: string;
  policyName: string;
  insurer: string;
  chunkIds: string[];
};

type LoginResponse = {
  ok: boolean;
  message?: string;
};

type PoliciesResponse = {
  policies: PolicyRow[];
};

export default function AdminPanel(): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [deletingPolicyId, setDeletingPolicyId] = useState<string | null>(null);

  const hasPolicies = useMemo(() => policies.length > 0, [policies]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadPolicies();
  }, [isAuthenticated]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      // Backend route should validate against process.env.ADMIN_USERNAME and process.env.ADMIN_PASSWORD.
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as LoginResponse;
      if (!response.ok || !data.ok) {
        setAuthError(data.message || "Invalid credentials.");
        return;
      }

      setIsAuthenticated(true);
    } catch {
      setAuthError("Unable to sign in. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadPolicies(): Promise<void> {
    setListLoading(true);
    setListError("");

    try {
      const response = await fetch("/api/admin/policies", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to load policies");
      }

      const data = (await response.json()) as PoliciesResponse;
      setPolicies(data.policies || []);
    } catch {
      setListError("Could not fetch policies.");
    } finally {
      setListLoading(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedFile) {
      setUploadMessage("Please select a PDF first.");
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setUploadMessage("Only PDF files are supported.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Backend route should parse the PDF and index chunks.
      const response = await fetch("/api/admin/upload-policy", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      setSelectedFile(null);
      setUploadMessage("Upload successful.");
      await loadPolicies();
    } catch {
      setUploadMessage("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(policy: PolicyRow): Promise<void> {
    // Explicit confirmation step before deletion.
    const confirmed = window.confirm(
      `Delete ${policy.policyName}? This will remove indexed chunks and cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setDeletingPolicyId(policy.id);
    try {
      // Backend route should call delete_policy_chunks_by_id(policy.chunkIds).
      const response = await fetch("/api/admin/delete-policy-chunks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: policy.id, chunkIds: policy.chunkIds }),
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await loadPolicies();
    } catch {
      setListError("Delete failed. Please try again.");
    } finally {
      setDeletingPolicyId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto mt-16 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">AarogyaAid Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to manage uploaded policies.</p>

        <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {authError ? <p className="text-sm text-rose-700">{authError}</p> : null}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {authLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto my-8 w-full max-w-6xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">AarogyaAid Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-600">Upload policy PDFs and manage indexed policy chunks.</p>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          type="button"
        >
          Logout
        </button>
      </header>

      <form onSubmit={handleUpload} className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            setSelectedFile(file);
          }}
          className="block text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-800"
        />

        <button
          type="submit"
          disabled={uploading}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>

        {uploadMessage ? <p className="text-sm text-slate-700">{uploadMessage}</p> : null}
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">File Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Upload Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Policy Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Insurer</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {listLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-600">
                  Loading policies...
                </td>
              </tr>
            ) : hasPolicies ? (
              policies.map((policy) => (
                <tr key={policy.id}>
                  <td className="px-4 py-3 text-sm text-slate-800">{policy.fileName}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{policy.uploadDate}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{policy.policyName}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{policy.insurer}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDelete(policy)}
                      disabled={deletingPolicyId === policy.id}
                      className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {deletingPolicyId === policy.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-600">
                  No policies uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {listError ? <p className="mt-3 text-sm text-rose-700">{listError}</p> : null}
    </section>
  );
}
