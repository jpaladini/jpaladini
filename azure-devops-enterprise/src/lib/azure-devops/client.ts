import type {
  AzdoBuild,
  AzdoList,
  AzdoProject,
  AzdoPullRequest,
  AzdoRepository,
  AzdoWiqlResult,
  AzdoWorkItem,
  PullRequestStatus,
} from "./types";

const DEFAULT_API_VERSION = process.env.AZDO_API_VERSION || "7.1";

export class AzureDevOpsError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "AzureDevOpsError";
  }
}

export interface AzureDevOpsClientOptions {
  organization: string;
  /** Personal Access Token. Sent as HTTP Basic auth (":" + PAT). */
  pat: string;
  apiVersion?: string;
  /** Override the base host (e.g. for Azure DevOps Server / on-prem). */
  baseUrl?: string;
}

/**
 * A thin, typed wrapper over the Azure DevOps REST API.
 *
 * This is the heart of the console — the "API woven into a usable form."
 * It runs only on the server so the PAT is never exposed to the browser.
 * Add methods here as your team needs more of Azure DevOps surfaced.
 */
export class AzureDevOpsClient {
  private readonly organization: string;
  private readonly apiVersion: string;
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(opts: AzureDevOpsClientOptions) {
    if (!opts.organization) throw new Error("organization is required");
    if (!opts.pat) throw new Error("pat is required");
    this.organization = opts.organization;
    this.apiVersion = opts.apiVersion || DEFAULT_API_VERSION;
    this.baseUrl = (opts.baseUrl || "https://dev.azure.com").replace(/\/$/, "");
    // PAT auth: Basic base64(":" + token)
    this.authHeader =
      "Basic " + Buffer.from(":" + opts.pat).toString("base64");
  }

  /** Build a full org/project-scoped API URL with api-version applied. */
  private url(path: string, query: Record<string, string | number | undefined> = {}) {
    const url = new URL(`${this.baseUrl}/${this.organization}/${path}`);
    if (!url.searchParams.has("api-version")) {
      url.searchParams.set("api-version", this.apiVersion);
    }
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
    return url.toString();
  }

  private async request<T>(
    fullUrl: string,
    init?: RequestInit,
  ): Promise<T> {
    const res = await fetch(fullUrl, {
      ...init,
      headers: {
        Authorization: this.authHeader,
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      // Azure DevOps data is request-time; never cache at the fetch layer.
      cache: "no-store",
    });

    if (!res.ok) {
      // A 203 / sign-in HTML body usually means the PAT is invalid or expired.
      const text = await res.text().catch(() => "");
      const snippet = text.slice(0, 200);
      throw new AzureDevOpsError(
        `Azure DevOps request failed (${res.status}): ${snippet}`,
        res.status,
        fullUrl,
      );
    }

    // Some endpoints (204) return no body.
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  /** Validate credentials by listing projects; throws on bad PAT/org. */
  async verify(): Promise<void> {
    await this.listProjects();
  }

  async listProjects(): Promise<AzdoProject[]> {
    const data = await this.request<AzdoList<AzdoProject>>(
      this.url("_apis/projects", { $top: 200 }),
    );
    return data.value;
  }

  async getProject(projectName: string): Promise<AzdoProject> {
    return this.request<AzdoProject>(
      this.url(`_apis/projects/${encodeURIComponent(projectName)}`),
    );
  }

  /** Most recent builds across a project (newest first). */
  async listBuilds(project: string, top = 25): Promise<AzdoBuild[]> {
    const data = await this.request<AzdoList<AzdoBuild>>(
      this.url(`${encodeURIComponent(project)}/_apis/build/builds`, {
        $top: top,
        queryOrder: "queueTimeDescending",
      }),
    );
    return data.value;
  }

  async listPullRequests(
    project: string,
    status: PullRequestStatus = "active",
    top = 50,
  ): Promise<AzdoPullRequest[]> {
    const data = await this.request<AzdoList<AzdoPullRequest>>(
      this.url(`${encodeURIComponent(project)}/_apis/git/pullrequests`, {
        "searchCriteria.status": status,
        $top: top,
      }),
    );
    return data.value;
  }

  async listRepositories(project: string): Promise<AzdoRepository[]> {
    const data = await this.request<AzdoList<AzdoRepository>>(
      this.url(`${encodeURIComponent(project)}/_apis/git/repositories`),
    );
    return data.value;
  }

  /**
   * Run a WIQL query and hydrate the resulting work items in one call.
   * Defaults to "my recently changed items" so the dashboard has signal.
   */
  async queryWorkItems(
    project: string,
    wiql?: string,
    maxItems = 50,
  ): Promise<AzdoWorkItem[]> {
    const query =
      wiql ||
      `SELECT [System.Id] FROM WorkItems
       WHERE [System.TeamProject] = @project
       AND [System.State] <> 'Closed' AND [System.State] <> 'Done'
       ORDER BY [System.ChangedDate] DESC`;

    const wiqlResult = await this.request<AzdoWiqlResult>(
      this.url(`${encodeURIComponent(project)}/_apis/wit/wiql`),
      { method: "POST", body: JSON.stringify({ query }) },
    );

    const ids = wiqlResult.workItems.slice(0, maxItems).map((w) => w.id);
    if (ids.length === 0) return [];

    const fields = [
      "System.Id",
      "System.Title",
      "System.State",
      "System.WorkItemType",
      "System.AssignedTo",
      "System.ChangedDate",
    ];

    const batch = await this.request<AzdoList<AzdoWorkItem>>(
      this.url(`${encodeURIComponent(project)}/_apis/wit/workitemsbatch`),
      { method: "POST", body: JSON.stringify({ ids, fields }) },
    );
    return batch.value;
  }

  /** Public web URL for the org, handy for "open in Azure DevOps" links. */
  webUrl(path = ""): string {
    return `https://dev.azure.com/${this.organization}/${path}`.replace(
      /\/$/,
      "",
    );
  }
}
