import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

/** POST /api/auth/logout — clears the session cookie. */
export async function POST(request: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
