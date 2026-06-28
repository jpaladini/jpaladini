"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_ORG = process.env.NEXT_PUBLIC_AZDO_DEFAULT_ORG || "";

export default function LoginPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState(DEFAULT_ORG);
  const [pat, setPat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization, pat }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-azure-700 dark:text-azure-100">
          Azure DevOps Console
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect with your organization and a Personal Access Token.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium" htmlFor="org">
              Organization
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-slate-300 focus-within:border-azure-500 dark:border-slate-700">
              <span className="select-none px-3 text-sm text-slate-400">
                dev.azure.com/
              </span>
              <input
                id="org"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="contoso"
                autoComplete="off"
                className="w-full rounded-r-lg bg-transparent py-2 pr-3 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="pat">
              Personal Access Token
            </label>
            <input
              id="pat"
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="••••••••••••••••"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:border-azure-500 dark:border-slate-700"
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              Create one at dev.azure.com → User settings → Personal access
              tokens. Read scopes (Code, Build, Work Items) are enough to start.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-azure-500 py-2 font-medium text-white transition hover:bg-azure-600 disabled:opacity-60"
          >
            {loading ? "Connecting…" : "Connect"}
          </button>
        </form>
      </div>
    </main>
  );
}
