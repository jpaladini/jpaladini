import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { AppHeader } from "@/components/AppHeader";
import { BuildBadge, Pill } from "@/components/StatusBadge";
import { identityName, shortBranch, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project: projectParam } = await params;
  const project = decodeURIComponent(projectParam);
  const client = await requireClient();
  const session = await getSession();

  // Fetch the three panels in parallel; tolerate individual failures so one
  // missing scope doesn't blank the whole page.
  const [builds, pullRequests, workItems] = await Promise.all([
    client.listBuilds(project, 10).catch(() => []),
    client.listPullRequests(project, "active", 10).catch(() => []),
    client.queryWorkItems(project, undefined, 10).catch(() => []),
  ]);

  return (
    <>
      <AppHeader organization={session?.organization ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            ← All projects
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{project}</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent builds */}
          <Panel title="Recent builds" count={builds.length}>
            {builds.length === 0 ? (
              <Empty>No recent builds.</Empty>
            ) : (
              builds.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {b.definition.name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {shortBranch(b.sourceBranch)} · {timeAgo(b.startTime ?? b.queueTime)}
                    </p>
                  </div>
                  <BuildBadge status={b.status} result={b.result} />
                </li>
              ))
            )}
          </Panel>

          {/* Active pull requests */}
          <Panel title="Active pull requests" count={pullRequests.length}>
            {pullRequests.length === 0 ? (
              <Empty>No active pull requests.</Empty>
            ) : (
              pullRequests.map((pr) => (
                <li key={pr.pullRequestId} className="py-2">
                  <p className="truncate text-sm font-medium">
                    {pr.isDraft && <span className="text-slate-400">[draft] </span>}
                    {pr.title}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {identityName(pr.createdBy)} · {shortBranch(pr.sourceRefName)} →{" "}
                    {shortBranch(pr.targetRefName)} · {timeAgo(pr.creationDate)}
                  </p>
                </li>
              ))
            )}
          </Panel>

          {/* Work items */}
          <Panel title="Open work items" count={workItems.length}>
            {workItems.length === 0 ? (
              <Empty>No open work items.</Empty>
            ) : (
              workItems.map((wi) => (
                <li key={wi.id} className="py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {wi.fields["System.Title"]}
                    </p>
                    <Pill>{String(wi.fields["System.State"] ?? "")}</Pill>
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {String(wi.fields["System.WorkItemType"] ?? "")} ·{" "}
                    {identityName(
                      wi.fields["System.AssignedTo"] as
                        | { displayName?: string }
                        | string
                        | undefined,
                    )}
                  </p>
                </li>
              ))
            )}
          </Panel>
        </div>
      </main>
    </>
  );
}

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-medium">{title}</h2>
        <span className="text-xs text-slate-400">{count}</span>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {children}
      </ul>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <li className="py-3 text-sm text-slate-400">{children}</li>;
}
