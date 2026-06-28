import "server-only";
import { redirect } from "next/navigation";
import { AzureDevOpsClient } from "./azure-devops/client";
import { getSession } from "./session";

/**
 * Build an AzureDevOpsClient from the current session, or null if logged out.
 * Use this in server components / route handlers.
 */
export async function getClient(): Promise<AzureDevOpsClient | null> {
  const session = await getSession();
  if (!session) return null;
  return new AzureDevOpsClient({
    organization: session.organization,
    pat: session.pat,
  });
}

/** Like getClient(), but redirects to /login when there is no session. */
export async function requireClient(): Promise<AzureDevOpsClient> {
  const client = await getClient();
  if (!client) redirect("/login");
  return client;
}
