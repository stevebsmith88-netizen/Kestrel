import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { clinicSearchPattern } from "@/lib/admin-loaders";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Clinics | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Row = { id: string; clinic_name: string; city: string; province: string; practice_type: string };

// Admin, Clinics (Steve, 14th November 2026): find a clinic to help it with its profile, team or posting.
export default async function AdminClinics({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireRole("admin");
  const { q = "" } = await searchParams;
  const search = q.trim().slice(0, 120);
  const admin = supabaseAdmin();
  let rows: Row[] = [];
  if (admin) {
    if (search.includes("@")) {
      // By email: the owner's or a team member's. Fine at Kestrel's size; listUsers reads up to 1,000 accounts.
      const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const ids = (data?.users ?? []).filter((u) => (u.email ?? "").toLowerCase().includes(search.toLowerCase())).map((u) => u.id).slice(0, 50);
      if (ids.length) {
        const [{ data: owned }, { data: memberOf }] = await Promise.all([
          admin.from("employers").select("id").in("owner_id", ids),
          admin.from("employer_members").select("employer_id").in("user_id", ids),
        ]);
        const employerIds = [...(owned ?? []).map((e) => e.id as string), ...(memberOf ?? []).map((m) => m.employer_id as string)];
        if (employerIds.length) rows = ((await admin.from("employers").select("id, clinic_name, city, province, practice_type").in("id", employerIds).order("clinic_name")).data ?? []) as Row[];
      }
    } else {
      const pattern = clinicSearchPattern(search);
      const { data } = await admin.from("employers").select("id, clinic_name, city, province, practice_type").not("owner_id", "is", null).or(`clinic_name.ilike.${pattern},city.ilike.${pattern}`).order("clinic_name").limit(50);
      rows = (data ?? []) as Row[];
    }
  }
  return (
    <>
      <AppBar session={session} current="/admin/clinics" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Clinics</h1>
          <p className="lede2">Help a clinic with its profile, team or posting. A clinic&apos;s team and settings open only while its owner has asked for help and allowed access (see <Link href="/admin/requests">Help requests</Link>). Every change asks why, is recorded, and the owner is told. Applicants&apos; resumes are never shown here.</p>
          <form method="get" className="panel">
            <label className="lab" htmlFor="ac-q">Clinic name, town or email</label>
            <input id="ac-q" name="q" type="search" defaultValue={search} />
            <button type="submit" className="btn sm">Search</button>
          </form>
          {rows.length === 0 ? (
            <p className="help">{search ? "No clinics found." : "Clinics with an account are listed here."}</p>
          ) : (
            <ul className="alertlist">
              {rows.map((c) => (
                <li key={c.id}>
                  <span><strong>{c.clinic_name}</strong><br /><span className="help">{c.city}, {c.province}</span></span>
                  <span className="jobactions"><Link href={`/admin/clinics/${c.id}`} className="btn sm">Open</Link></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
