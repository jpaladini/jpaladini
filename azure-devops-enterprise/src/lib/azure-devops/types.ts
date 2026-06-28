/**
 * Minimal, hand-curated TypeScript shapes for the slices of the Azure DevOps
 * REST API this console uses. These intentionally cover only the fields we
 * render — extend them as you add features for your team.
 *
 * Reference: https://learn.microsoft.com/en-us/rest/api/azure/devops
 */

/** A generic Azure DevOps "list" envelope: { count, value: [...] }. */
export interface AzdoList<T> {
  count: number;
  value: T[];
}

export interface AzdoProject {
  id: string;
  name: string;
  description?: string;
  url: string;
  state: string;
  visibility?: string;
  lastUpdateTime?: string;
}

export type BuildStatus =
  | "none"
  | "inProgress"
  | "completed"
  | "cancelling"
  | "postponed"
  | "notStarted";

export type BuildResult =
  | "none"
  | "succeeded"
  | "partiallySucceeded"
  | "failed"
  | "canceled";

export interface AzdoBuild {
  id: number;
  buildNumber: string;
  status: BuildStatus;
  result?: BuildResult;
  queueTime?: string;
  startTime?: string;
  finishTime?: string;
  sourceBranch?: string;
  definition: { id: number; name: string };
  requestedFor?: AzdoIdentityRef;
  _links?: { web?: { href: string } };
}

export interface AzdoIdentityRef {
  displayName: string;
  uniqueName?: string;
  imageUrl?: string;
  id?: string;
}

export type PullRequestStatus = "active" | "abandoned" | "completed" | "all";

export interface AzdoPullRequest {
  pullRequestId: number;
  title: string;
  status: PullRequestStatus;
  createdBy: AzdoIdentityRef;
  creationDate: string;
  sourceRefName: string;
  targetRefName: string;
  isDraft?: boolean;
  repository: { id: string; name: string; project?: { name: string } };
}

export interface AzdoRepository {
  id: string;
  name: string;
  defaultBranch?: string;
  size?: number;
  webUrl?: string;
}

export interface AzdoWorkItem {
  id: number;
  fields: {
    "System.Title"?: string;
    "System.State"?: string;
    "System.WorkItemType"?: string;
    "System.AssignedTo"?: AzdoIdentityRef | string;
    "System.ChangedDate"?: string;
    [key: string]: unknown;
  };
  url: string;
}

export interface AzdoWiqlResult {
  workItems: { id: number; url: string }[];
}
