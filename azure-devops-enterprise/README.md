# Azure DevOps Enterprise Console

A **clone-and-customize** web console for your organization's Azure DevOps.

This is a from-scratch web reimagining inspired by
[PurpleSoftSrl/azure_devops_app](https://github.com/PurpleSoftSrl/azure_devops_app)
(a Flutter mobile app). Instead of porting Dart to the browser, this project
puts the same idea — *the Azure DevOps REST API woven into a usable form* — into
a typed TypeScript client and a Next.js web app you can self-host, brand, and
extend for the way your team actually works.

> **Status:** MVP. Auth (PAT) + a project dashboard with builds, pull requests,
> and work items. Built to be extended — see "Roadmap".

## Why this exists

The official Azure DevOps web UI is one-size-fits-all. The goal here is a
console your team owns: clone it, point it at your org, and add the views,
filters, and rollups that matter to *you* (release dashboards, on-call PR
queues, cross-project work-item boards, etc.).

## Architecture

```
src/
  lib/
    azure-devops/
      client.ts   # AzureDevOpsClient — the typed REST wrapper (server-only)
      types.ts    # curated response shapes
    session.ts    # encrypted httpOnly cookie holding { org, PAT }
    auth.ts       # getClient() / requireClient() for server components
    format.ts     # small display helpers
  app/
    login/        # PAT + org login screen
    api/auth/     # login (validates + sets cookie) and logout routes
    page.tsx      # dashboard: list of projects
    projects/[project]/  # per-project: builds, PRs, work items
  components/     # header, status badges
```

**Key design choices**

- **Server-side only secrets.** The PAT is validated, encrypted (AES-256-GCM)
  with `SESSION_SECRET`, and stored in an httpOnly cookie. All Azure DevOps
  calls happen in server components / route handlers — the token never reaches
  the browser, and there are no CORS issues.
- **Thin, typed client.** `AzureDevOpsClient` is the one place that knows about
  REST URLs and api-versions. Add a method, get a typed feature.

## Getting started

```bash
cd azure-devops-enterprise
npm install
cp .env.example .env        # then set SESSION_SECRET (openssl rand -base64 32)
npm run dev                 # http://localhost:3000
```

Then sign in with:

- **Organization** — the slug in `https://dev.azure.com/<org>`.
- **Personal Access Token** — create at *dev.azure.com → User settings →
  Personal access tokens*. Read scopes for **Code**, **Build**, and
  **Work Items** are enough for the current views.

## Extending it for your team

Add a client method, then render it. Example — top contributors, surfaced as a
new dashboard panel:

```ts
// src/lib/azure-devops/client.ts
async listCommits(project: string, repoId: string, top = 20) {
  const data = await this.request<AzdoList<{ commitId: string; comment: string }>>(
    this.url(`${encodeURIComponent(project)}/_apis/git/repositories/${repoId}/commits`,
      { "searchCriteria.$top": top }),
  );
  return data.value;
}
```

The client already implements: `listProjects`, `getProject`, `listBuilds`,
`listPullRequests`, `listRepositories`, `queryWorkItems` (WIQL + batch hydrate).

## Auth roadmap

The session layer is intentionally swappable:

1. **PAT (now)** — zero app registration, works in any org. Good for piloting.
2. **Entra ID / Azure AD SSO (next)** — OAuth so users sign in with their
   Microsoft identity; exchange for an Azure DevOps access token. Replace the
   contents of `lib/session.ts` / `lib/auth.ts`; the rest of the app is
   unchanged because it only depends on `getClient()`.
3. **Azure DevOps Server / on-prem** — pass `baseUrl` to `AzureDevOpsClient`.

## Roadmap

- [ ] Org/project switcher (multi-org sessions)
- [ ] Build/PR/work-item detail pages with drill-down
- [ ] Entra ID SSO
- [ ] Customizable dashboard widgets per team
- [ ] Caching layer for large orgs

## Deploying

Designed for Vercel (set `SESSION_SECRET` as an env var) or any Node host
(`npm run build && npm start`). Because all data is fetched server-side per
request, run it somewhere with network access to `dev.azure.com` (or your
on-prem server).

## License

This is an original implementation. The upstream Flutter app is MIT-licensed;
this project takes inspiration, not code.
