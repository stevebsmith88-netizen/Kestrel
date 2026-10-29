import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth-copy";
import { supabaseServer } from "@/lib/supabase/server";

// Where "Sign in with Google" sends people back to (added in a later step).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const db = await supabaseServer();
  if (db && code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", origin));
}
