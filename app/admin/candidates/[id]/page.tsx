import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { isDemoAccountEmail } from "@/lib/admin-candidates";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Candidate | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 1 candidate, for Kestrel's admin to see who registered. What they have set up, with counts only: no resume, no notes, nothing an application says.
export default async function AdminCandidate({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  const { id } = await params;
  const admin = supabaseAdmin();
  if (!UUID.test(id) || !admin) notFound();
  const { data: profile } = await admin.from("profiles").select("id, full_name, role, marketing_consent, created_at").eq("id", id).eq("role", "candidate").maybeSingle();
  if (!profile) notFound();
  const [{ data: user }, { data: cand }, { count: applications }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("candidate_profiles").select("profession, home_city, home_province, licensed_provinces, cv_path").eq("user_id", id).maybeSingle(),
    admin.from("applications").select("*", { count: "exact", head: true }).eq("candidate_id", id),
  ]);
  const email = user?.user?.email ?? "";
  if (isDemoAccountEmail(email)) notFound();
  const place = [cand?.home_city, cand?.home_province].filter(Boolean).join(", ");
  const licensed = (cand?.licensed_provinces as string[] | null) ?? [];
  const facts: [string, string][] = [
    ["Email", email || "Not available"],
    ["Joined", longDate(profile.created_at as string)],
    ["Profession", (cand?.profession as string | null) ?? "Not given"],
    ["Home town", place || "Not given"],
    ["Registered in", licensed.length ? licensed.join(", ") : "Not given"],
    ["Resume uploaded", cand?.cv_path ? "Yes" : "No"],
    ["Applications sent", String(applications ?? 0)],
    ["Agreed to news and offers", profile.marketing_consent ? "Yes" : "No"],
  ];
  return (
    <>
      <AppBar session={session} current="/admin/candidates" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="back"><Link href="/admin/candidates">Back to candidates</Link></p>
          <h1>{(profile.full_name as string) || "Name not given"}</h1>
          <p className="lede2">What this candidate has set up. Resumes and what an application says are never shown here.</p>
          <dl className="facts">
            {facts.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
