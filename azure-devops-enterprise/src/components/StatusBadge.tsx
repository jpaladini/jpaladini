import type { BuildResult, BuildStatus } from "@/lib/azure-devops/types";

const RESULT_STYLES: Record<string, string> = {
  succeeded: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  partiallySucceeded:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  canceled: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

/** Renders a build's status/result as a colored pill. */
export function BuildBadge({
  status,
  result,
}: {
  status: BuildStatus;
  result?: BuildResult;
}) {
  const label =
    status === "completed" ? result ?? "completed" : status;
  const cls =
    (result && RESULT_STYLES[result]) ||
    (status === "inProgress"
      ? "bg-azure-100 text-azure-700 dark:bg-slate-800 dark:text-azure-100"
      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300");
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

/** Generic small pill for arbitrary text (work item state, PR status, …). */
export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {children}
    </span>
  );
}
