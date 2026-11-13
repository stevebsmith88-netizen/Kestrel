import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Post for a clinic | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  submitted: "Saved and sent to the review queue. Approve it there when you are ready.",
  draft: "Saved as a draft on the clinic's account. The clinic can finish it from its dashboard.",
};

type Clinic = { id: string; clinic_name: string; city: string; province: string; claimed: boolean | null };

export default async function PostForClinic({ searchParams }: { searchParams: Promise<{ q?: string; notice?: string }> }) {
  const session = await requireRole("admin");
  const { q = "", notice } = await searchParams;
  const search = q.trim().slice(0, 80);
  const db = supabaseAdmin();
  // Only clinics that have an account (an owner) can have a job posted for them.
  const pattern = search ? `%${search.replace(/[%,()]/g, " ")}%` : "%";
  const { data } = db
    ? await db.from("employers").select("id, clinic_name, city, province, claimed").not("owner_id", "is", null).ilike("clinic_name", pattern).order("clinic_name").limit(50)
    : { data: null };
  const clinics = (data ?? []) as Clinic[];
  return (
    <>
      <AppBar session={session} current="/admin/post-for-clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Post a job for a clinic</h1>
          <p className="lede2">For when a clinic is having trouble with the form. The job belongs to the clinic, follows the same rules as any post, and goes to the review queue for you to approve. This is separate from Found listings.</p>
          {notice && NOTICES[notice] && <p className="notice" role="status">{NOTICES[notice]}</p>}
          <form method="get" className="panel">
            <label className="lab" htmlFor="pc-q">Find a clinic by name</label>
            <input id="pc-q" name="q" type="search" defaultValue={search} />
            <button type="submit" className="btn sm">Search</button>
          </form>
          {clinics.length === 0 ? (
            <p className="help">No clinics found. A clinic needs an account and a clinic profile first.</p>
          ) : (
            <ul className="alertlist">
              {clinics.map((c) => (
                <li key={c.id}>
                  <span><strong>{c.clinic_name}</strong><br /><span className="help">{c.city}, {c.province}</span></span>
                  <span className="jobactions"><Link href={`/admin/post-for-clinic/${c.id}`} className="btn sm">Post a job</Link></span>
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
