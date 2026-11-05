import { NextResponse, type NextRequest } from "next/server";
import { MAINTENANCE_HTML, maintenanceOn } from "@/lib/maintenance";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // The off switch (MAINTENANCE_MODE in Vercel). Pages and form posts get a plain "back soon" page, and nothing else runs.
  if (maintenanceOn()) {
    return new NextResponse(MAINTENANCE_HTML, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "3600", "Cache-Control": "no-store" } });
  }
  return updateSession(request);
}

// Every page except static files and the API routes. The sign in session is refreshed on whichever page someone
// opens, so it can never be used up on a public page without being saved.
export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)"],
};
