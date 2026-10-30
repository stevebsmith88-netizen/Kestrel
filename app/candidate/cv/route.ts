import { getSession } from "@/lib/auth";
import { getMyCandidateProfile } from "@/lib/candidate";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Lets a candidate open their own CV. The file itself is private; this hands out a link
// that works for one minute, and only to the person it belongs to.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "candidate") return new Response("Not found", { status: 404 });
  const profile = await getMyCandidateProfile(session.userId);
  const admin = supabaseAdmin();
  if (!profile?.cv_path || !admin) return new Response("Not found", { status: 404 });
  const { data } = await admin.storage.from("cvs").createSignedUrl(profile.cv_path, 60, { download: profile.cv_filename ?? "cv" });
  if (!data?.signedUrl) return new Response("Not found", { status: 404 });
  return Response.redirect(data.signedUrl, 302);
}
