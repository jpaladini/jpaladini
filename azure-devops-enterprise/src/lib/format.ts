/** Small formatting helpers shared across views. */

/** Relative time like "3h ago", "2d ago" from an ISO timestamp. */
export function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const seconds = Math.floor((Date.now() - then) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.35, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let value = seconds;
  let unit = "s";
  for (const [factor, label] of units) {
    if (value < factor) {
      unit = label;
      break;
    }
    value = Math.floor(value / factor);
    unit = label;
  }
  return `${value}${unit} ago`;
}

/** Turn "refs/heads/main" into "main". */
export function shortBranch(ref?: string): string {
  if (!ref) return "—";
  return ref.replace(/^refs\/heads\//, "").replace(/^refs\//, "");
}

/** Resolve an Azure DevOps identity (object or string) to a display name. */
export function identityName(
  value: { displayName?: string } | string | undefined,
): string {
  if (!value) return "Unassigned";
  if (typeof value === "string") return value;
  return value.displayName ?? "Unassigned";
}
