import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth-copy";
import { supabaseServer } from "@/lib/supabase/server";

// Where "Continue with Google" sends people back to.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // Cancelled on Google's page, or Google refused.
  if (searchParams.get("error") || searchParams.get("error_description")) return NextResponse.redirect(new URL("/sign-in?error=google", origin));
  const next = safeNext(searchParams.get("next"));

  const db = await supabaseServer();
  if (db && code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", origin));
}
