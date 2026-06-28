import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { AppHeader } from "@/components/AppHeader";
import { AzureDevOpsError } from "@/lib/azure-devops/client";
import type { AzdoProject } from "@/lib/azure-devops/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const client = await requireClient();
  const session = await getSession();

  let projects: AzdoProject[] = [];
  let error: string | null = null;
  try {
    projects = await client.listProjects();
  } catch (err) {
    error =
      err instanceof AzureDevOpsError
        ? `Could not load projects (${err.status}).`
        : "Could not load projects.";
    projects = [];
  }

  return (
    <>
      <AppHeader organization={session?.organization ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-xl font-semibold">Projects</h1>
          <span className="text-sm text-slate-500">
            {projects.length} project{projects.length === 1 ? "" : "s"}
          </span>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {projects.length === 0 && !error ? (
          <p className="text-slate-500">
            No projects found for this organization.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${encodeURIComponent(p.name)}`}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-azure-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="font-medium text-azure-700 dark:text-azure-100">
                  {p.name}
                </h2>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {p.description}
                  </p>
                )}
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                  {p.visibility ?? p.state}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
