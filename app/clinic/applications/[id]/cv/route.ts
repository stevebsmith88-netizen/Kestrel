import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Lets a clinic open the CV sent with an application to one of its own jobs. The database
// decides whether this application is theirs; the link works for one minute.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "clinic" || !UUID.test(id)) return new Response("Not found", { status: 404 });
  const db = await supabaseServer();
  const admin = supabaseAdmin();
  if (!db || !admin) return new Response("Not found", { status: 404 });
  const { data } = await db.from("applications").select("cv_path, cv_filename").eq("id", id).maybeSingle();
  if (!data?.cv_path) return new Response("Not found", { status: 404 });
  const { data: signed } = await admin.storage.from("cvs").createSignedUrl(data.cv_path, 60, { download: data.cv_filename ?? "cv" });
  if (!signed?.signedUrl) return new Response("Not found", { status: 404 });
  return Response.redirect(signed.signedUrl, 302);
}
