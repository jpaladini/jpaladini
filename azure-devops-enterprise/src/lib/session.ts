import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

/**
 * Session = the user's Azure DevOps org + PAT, encrypted at rest in an
 * httpOnly cookie. The PAT is decrypted only on the server when constructing
 * an AzureDevOpsClient, so it never reaches the browser.
 *
 * This is deliberately simple (single-cookie, no external store) so the
 * template clones-and-runs. For production you may swap this for a server-side
 * session store (Redis, DB) or Entra ID tokens — see README "Auth roadmap".
 */

const COOKIE_NAME = "azdo_session";
const ALGORITHM = "aes-256-gcm";

export interface SessionData {
  organization: string;
  pat: string;
}

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a 32-byte random value in .env (openssl rand -base64 32).",
    );
  }
  // Derive a stable 32-byte key from whatever secret length is provided.
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv.tag.ciphertext, all base64url
  return [iv, tag, enc].map((b) => b.toString("base64url")).join(".");
}

function decrypt(token: string): string {
  const [ivB64, tagB64, dataB64] = token.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("malformed session token");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

export async function createSession(data: SessionData): Promise<void> {
  const token = encrypt(JSON.stringify(data));
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return JSON.parse(decrypt(token)) as SessionData;
  } catch {
    // Tampered or key-rotated cookie — treat as logged out.
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
