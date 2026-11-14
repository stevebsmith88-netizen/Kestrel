import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { AdminCancel, AdminMakeOwner, AdminProfileForm, AdminRemove, AdminResend } from "@/components/AdminClinicForms";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { levelLabel } from "@/lib/team";
import { loadTeam } from "@/lib/team-server";
import { clinicAccess } from "@/lib/support-server";
import { reasonLabel } from "@/lib/support";

export const metadata: Metadata = { title: "Clinic | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 1 clinic, for Kestrel's admin to help: profile, team, open invitations, jobs (with applicant counts only) and the record of changes.
export default async function AdminClinic({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("admin");
  const { id } = await params;
  const admin = supabaseAdmin();
  if (!UUID.test(id) || !admin) notFound();
  const { data: clinic } = await admin.from("employers").select("id, clinic_name, practice_type, website, province, city, about, status, claimed").eq("id", id).maybeSingle();
  if (!clinic) notFound();
  const [{ people, invites }, { data: jobs }, { data: log }] = await Promise.all([
    loadTeam(admin, id),
    admin.from("jobs").select("id, title, status, posted_at, expires_at").eq("employer_id", id).order("created_at", { ascending: false }).limit(50),
    admin.from("admin_actions").select("action, detail, reason, created_at").eq("employer_id", id).order("created_at", { ascending: false }).limit(50),
  ]);
  // Kestrel sees the team and can change things only while the clinic's owner has an open help request that allows it (migration 0046).
  const access = await clinicAccess(admin, id);
  const jobIds = (jobs ?? []).map((j) => j.id as string);
  const { data: apps } = jobIds.length ? await admin.from("applications").select("job_id").in("job_id", jobIds) : { data: [] };
  const appCount = (jobId: string) => (apps ?? []).filter((a) => a.job_id === jobId).length;
  return (
    <>
      <AppBar session={session} current="/admin/clinics" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="back"><Link href="/admin/clinics">Back to clinics</Link></p>
          <p className="kicker">{clinic.city}, {clinic.province}</p>
          <h1>{clinic.clinic_name}</h1>
          <p className="lede2">{clinic.status === "active" ? "Active" : "Suspended"} · {clinic.claimed ? "Claimed" : "Not claimed"}. {access && <Link href={`/admin/post-for-clinic/${clinic.id}`}>Post a job for this clinic</Link>}</p>

          {access ? (
            <div className="notice" role="status"><strong>Access given until {longDate(access.access_until as string)}</strong> for: {reasonLabel(access.reason as string | null)}. &quot;{access.message}&quot;</div>
          ) : (
            <div className="notice warn" role="status">This clinic has not given Kestrel access, so its team and settings are hidden and nothing can be changed. Its owner can ask for help, and allow access, from Help and feedback in their account.</div>
          )}

          {access && (<>
          <h2>Team</h2>
          <ul className="teamlist">
            {people.map((p) => (
              <li key={p.userId} className="card">
                <div><strong>{p.name}</strong><p className="meta">{p.email} · {levelLabel(p.level)}{p.since ? ` · since ${longDate(p.since)}` : ""}</p></div>
                {p.level !== "owner" && <div className="teamacts"><AdminMakeOwner employerId={id} userId={p.userId} /><AdminRemove employerId={id} userId={p.userId} /></div>}
              </li>
            ))}
            {invites.map((i) => (
              <li key={i.id} className="card invited">
                <div><strong>{i.name}</strong> <span className="badge">Invited</span><p className="meta">{i.email} · {levelLabel(i.level)} · until {longDate(i.expires_at)}</p></div>
                <div className="teamacts"><AdminResend employerId={id} id={i.id} /><AdminCancel employerId={id} id={i.id} /></div>
              </li>
            ))}
          </ul>
          </>)}

          <h2>Jobs</h2>
          {(jobs ?? []).length === 0 ? <p className="help">No jobs yet.</p> : (
            <ul className="alertlist">
              {(jobs ?? []).map((j) => (
                <li key={j.id}><span><strong>{j.title}</strong><br /><span className="help">{j.status}{j.expires_at ? ` · until ${longDate(j.expires_at)}` : ""} · {appCount(j.id)} applicants</span></span>{j.status === "live" && <Link href={`/jobs/${j.id}`} className="btn sm ghost">View</Link>}</li>
              ))}
            </ul>
          )}

          {access && <><h2>Profile</h2><AdminProfileForm clinic={clinic} /></>}

          <h2>Changes Kestrel made</h2>
          {(log ?? []).length === 0 ? <p className="help">None yet.</p> : (
            <ul className="alertlist">
              {(log ?? []).map((l, n) => <li key={n}><span><strong>{l.action}</strong>{l.detail ? `: ${l.detail}` : ""}<br /><span className="help">{longDate(l.created_at)}{l.reason ? ` · ${l.reason}` : ""}</span></span></li>)}
            </ul>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
