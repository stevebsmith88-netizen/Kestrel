import { getSession } from "@/lib/auth";
import { buildDataExport, type ExportDb } from "@/lib/data-export";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";
import { exportCheck, type ExportProblem } from "@/lib/export-check";

export const dynamic = "force-dynamic";

const back = (request: Request, problem?: ExportProblem) => Response.redirect(new URL(`/account${problem ? `?download=${problem}` : ""}#ac-download`, request.url), 303);

// Opening the address directly hands over nothing: it goes back to the account page, where the download asks for the password (P1-49).
export async function GET(request: Request) {
  return back(request);
}

// A signed in person downloads the information Kestrel holds about them, as a file they can open
// or keep. Everything is looked up by their own account id, which comes from their sign in.
// For clinics this covers their own profile and jobs, not other people's applications.
// The form on the account page posts the password (or, for Google sign in, the email address) first, as delete does (P1-49).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role === "admin") return new Response("Please sign in.", { status: 401 });
  const form = await request.formData().catch(() => null);
  const password = String(form?.get("password") ?? "");
  const check = exportCheck({ hasPassword: session.hasPassword, email: session.email, password, confirmEmail: String(form?.get("confirmEmail") ?? "") });
  if (check !== "ok" && check !== "check-password") return back(request, check);
  if (check === "check-password") {
    const auth = await supabaseServer();
    if (!auth) return new Response("Not available right now.", { status: 503 });
    const { error } = await auth.auth.signInWithPassword({ email: session.email, password });
    if (error) return back(request, "wrong-password");
  }
  const db = supabaseAdmin();
  if (!db) return new Response("Not available right now.", { status: 503 });

  const data = await buildDataExport(db as unknown as ExportDb, { userId: session.userId, email: session.email, role: session.role });

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kestrel-my-information-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
