import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth-copy";
import { supabaseServer } from "@/lib/supabase/server";

// Where "Continue with Google" sends people back to.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // Cancelled on Google's page, or Google refused.
  const problem = `${searchParams.get("error_description") ?? ""} ${searchParams.get("error") ?? ""}`;
  // While sign up is closed, a brand new Google account is refused by the database. Say so, instead of "try again".
  if (/saving new user|not open yet/i.test(problem)) return NextResponse.redirect(new URL("/sign-in?error=closed", origin));
  if (searchParams.get("error") || searchParams.get("error_description")) return NextResponse.redirect(new URL("/sign-in?error=google", origin));
  const next = safeNext(searchParams.get("next"));

  const db = await supabaseServer();
  if (db && code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", origin));
}
