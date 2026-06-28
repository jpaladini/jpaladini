import { NextResponse } from "next/server";
import { AzureDevOpsClient, AzureDevOpsError } from "@/lib/azure-devops/client";
import { createSession } from "@/lib/session";

/**
 * POST /api/auth/login
 * Body: { organization, pat }
 * Validates the credentials against Azure DevOps, then sets an encrypted
 * session cookie. The PAT is never returned to the client.
 */
export async function POST(request: Request) {
  let body: { organization?: string; pat?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const organization = body.organization?.trim();
  const pat = body.pat?.trim();

  if (!organization || !pat) {
    return NextResponse.json(
      { error: "Both organization and personal access token are required." },
      { status: 400 },
    );
  }

  const client = new AzureDevOpsClient({ organization, pat });
  try {
    await client.verify();
  } catch (err) {
    if (err instanceof AzureDevOpsError) {
      const msg =
        err.status === 401 || err.status === 203
          ? "Authentication failed. Check the organization name and that the PAT is valid and has the right scopes."
          : `Azure DevOps rejected the request (${err.status}).`;
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Could not reach Azure DevOps. Check the organization name." },
      { status: 502 },
    );
  }

  await createSession({ organization, pat });
  return NextResponse.json({ ok: true });
}
