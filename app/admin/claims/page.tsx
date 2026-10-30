import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { approveClaim, rejectClaim } from "@/lib/claim-actions";
import { hostOf } from "@/lib/claims";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Claims | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  approved: "Approved. The clinic now owns the listing and has been told.",
  rejected: "Claim declined, and the person has been told.",
  "need-note": "Please tell the person why, so they know what to do next.",
  "has-clinic": "That person's account already has a clinic profile, so it cannot take over another. Ask them to email you.",
  taken: "That listing has already been claimed.",
  error: "That didn't work. The claim may already have been handled. Please refresh and try again.",
};

type Claim = {
  id: string; claimant_name: string; claimant_email: string; role_at_clinic: string; method: string; note: string | null; verified_at: string | null; created_at: string;
  employers: { id: string; clinic_name: string; website: string | null; city: string; province: string } | null;
};

export default async function Claims({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("admin");
  const { notice } = await searchParams;
  const db = supabaseAdmin();
  const { data } = db
    ? await db.from("listing_claims").select("id, claimant_name, claimant_email, role_at_clinic, method, note, verified_at, created_at, employers(id, clinic_name, website, city, province)").eq("status", "pending_review").order("created_at", { ascending: true })
    : { data: null };
  const claims = (data ?? []) as unknown as Claim[];
  const jobIds: Record<string, string> = {};
  if (db && claims.length) {
    const { data: jobs } = await db.from("jobs").select("id, employer_id").in("employer_id", claims.map((c) => c.employers?.id).filter(Boolean) as string[]).eq("status", "live");
    (jobs ?? []).forEach((j) => { jobIds[j.employer_id] = j.id; });
  }
  return (
    <>
      <AppBar session={session} current="/admin/claims" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Admin</p>
          <h1>Listing claims</h1>
          <p className="lede2">Claims waiting for your decision. Approving one makes that clinic account the owner of the clinic profile and its listings.</p>
          {notice && NOTICES[notice] && <p className="notice" role="status">{NOTICES[notice]}</p>}
          {claims.length === 0 ? (
            <section className="card"><p>No claims are waiting.</p></section>
          ) : (
            <div className="joblist">
              {claims.map((c) => {
                const host = hostOf(c.employers?.website);
                return (
                  <article className="card review" key={c.id}>
                    <h2>{c.employers?.clinic_name}</h2>
                    <p className="meta">{c.employers?.city}, {c.employers?.province} · {host || "no website on file"} · claimed {longDate(c.created_at)}</p>
                    <div className={c.method === "email" ? "allclear" : "flags"}>
                      {c.method === "email" ? <p className="allclear">Confirmed by email at the clinic's own website {c.verified_at ? `on ${longDate(c.verified_at)}` : ""}.</p> : <strong>Not confirmed by email. Check this one by hand.</strong>}
                    </div>
                    <dl className="facts">
                      <div><dt>Who</dt><dd>{c.claimant_name || "No name"} ({c.role_at_clinic})</dd></div>
                      <div><dt>Email</dt><dd>{c.claimant_email}</dd></div>
                    </dl>
                    {c.note && <pre className="adtext">{c.note}</pre>}
                    {jobIds[c.employers?.id ?? ""] && <p><Link href={`/jobs/${jobIds[c.employers?.id ?? ""]}`}>Open the listing</Link></p>}
                    <div className="reviewbtns">
                      <form action={approveClaim}><input type="hidden" name="id" value={c.id} /><button type="submit" className="btn">Approve this claim</button></form>
                      <form action={rejectClaim} className="rejectform">
                        <input type="hidden" name="id" value={c.id} />
                        <label className="lab" htmlFor={`note-${c.id}`}>Or decline it, and tell them why</label>
                        <textarea id={`note-${c.id}`} name="note" rows={2} maxLength={1000} />
                        <button type="submit" className="btn ghost">Decline</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
