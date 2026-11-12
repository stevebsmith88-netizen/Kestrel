import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unreadCount } from "@/lib/notifications";

// Who is signed in, for the top bar on public pages (audit P1-10). Those pages are saved once and shown to everyone, so they are drawn
// signed out, and the browser asks here when it holds a sign in cookie. Only the person's own browser, with their own cookie, gets an
// answer about them, and the answer is never stored anywhere along the way (private, no-store).
export const dynamic = "force-dynamic";

const PRIVATE = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ signedIn: false }, { headers: PRIVATE });
  const unread = session.role !== "admin" ? await unreadCount() : 0;
  return NextResponse.json({ signedIn: true, role: session.role, email: session.email, fullName: session.fullName, unread }, { headers: PRIVATE });
}
