import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only the account pages. The public pages never touch the sign in session.
export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
    "/candidate/:path*",
    "/clinic/:path*",
    "/admin/:path*",
    "/account",
    "/auth/:path*",
    "/claim/:path*",
    "/welcome",
  ],
};
