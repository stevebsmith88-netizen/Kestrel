import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth-copy";
import { supabaseServer } from "@/lib/supabase/server";

// Where the links in our emails land (confirm your address, reset your password).
// The link carries a one time token, which works on any device, even if the email
// is opened on a phone after signing up on a computer.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const db = await supabaseServer();
  if (db && tokenHash && type) {
    const { error } = await db.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", origin));
}
