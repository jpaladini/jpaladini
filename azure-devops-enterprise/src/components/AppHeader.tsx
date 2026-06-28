import Link from "next/link";

/** Top bar shown on authenticated pages. */
export function AppHeader({ organization }: { organization: string }) {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold text-azure-700 dark:text-azure-100">
            Azure DevOps Console
          </span>
          <span className="rounded bg-azure-50 px-2 py-0.5 text-xs font-medium text-azure-700 dark:bg-slate-800 dark:text-azure-100">
            {organization}
          </span>
        </Link>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
