import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth-copy";
import { RECOVERY_COOKIE, RECOVERY_MINUTES, makeRecoveryValue } from "@/lib/recovery";
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
    const { data, error } = await db.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const response = NextResponse.redirect(new URL(next, origin));
      // A password reset link also leaves a short lived, signed note that lets the next page change the password.
      const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
      if (type === "recovery" && data.user && secret) {
        response.cookies.set(RECOVERY_COOKIE, makeRecoveryValue(secret, data.user.id), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: RECOVERY_MINUTES * 60 });
      }
      return response;
    }
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", origin));
}
