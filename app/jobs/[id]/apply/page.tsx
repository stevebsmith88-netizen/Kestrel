import { readMyApplications } from "@/lib/my-applications";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import ApplyForm from "@/components/ApplyForm";
import ApplySetup from "@/components/ApplySetup";
import SiteHeader from "@/components/SiteHeader";
import { applicantSnapshot, sentDetails } from "@/lib/application-details";
import { getSession } from "@/lib/auth";
import { getMyCandidateProfile, profileReady } from "@/lib/candidate";
import { longDate } from "@/lib/jobs";
import { payText } from "@/lib/job-pay";
import { canApplyForRole, roleMismatchText } from "@/lib/role-fit";
import { getLiveJob } from "@/lib/public-jobs";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Apply | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function Apply({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getLiveJob(id);
  if (!job) notFound();
  const clinic = job.employers?.clinic_name ?? "the clinic";
  const session = await getSession();
  const next = encodeURIComponent(`/jobs/${job.id}/apply`);

  let body: React.ReactNode;
  if (job.apply_method !== "kestrel") {
    body = (
      <section className="card"><p>This job takes applications on the clinic&apos;s own website.</p><Link href={`/jobs/${job.id}`} className="btn">Back to the job</Link></section>
    );
  } else if (!session) {
    body = (
      <section className="card setup">
        <h2>Sign in to apply</h2>
        <p>Create a free account, save your resume once, and apply to any job in a few clicks.</p>
        <div className="formbtns">
          <Link href={`/sign-in?next=${next}`} className="btn">Sign in</Link>
          <Link href={`/sign-up?next=${next}`} className="btn ghost">Create a free account</Link>
        </div>
      </section>
    );
  } else if (session.role !== "candidate") {
    body = <section className="card"><p>Applying is for candidate accounts. You are signed in as a {session.role === "clinic" ? "clinic" : "admin"}.</p></section>;
  } else {
    const profile = await getMyCandidateProfile(session.userId);
    const db = await supabaseServer();
    const { data: draft } = db ? await db.from("application_drafts").select("cover_letter, updated_at").eq("job_id", job.id).maybeSingle() : { data: null };
    const { data: letterRows } = db ? await db.from("cover_letter_templates").select("id, name, body").order("updated_at", { ascending: false }) : { data: null };
    const letters = (letterRows ?? []) as { id: string; name: string; body: string }[];
    const { data: existing } = db ? await readMyApplications<{ id: string }>(db, (source) => source.select("id").eq("job_id", job.id).maybeSingle()) : { data: null };
    if (existing) {
      body = <section className="card"><h2>You have already applied</h2><p>You can follow this application under My applications.</p><Link href={`/candidate/applications/${existing.id}`} className="btn">See my application</Link></section>;
    } else if (!profileReady(profile)) {
      // The first application: add what is missing here, with no detour to the profile page (Steve, 13th November 2026).
      body = (
        <ApplySetup
          needsResume={!profile?.cv_path}
          needsRole={!profile?.profession}
          needsTown={!(profile?.home_city && profile?.home_province)}
          current={{ profession: profile?.profession ?? undefined, city: profile?.home_city ?? undefined, province: profile?.home_province ?? undefined }}
        />
      );
    } else if (profile?.profession && !canApplyForRole(profile.profession, profile.pref_other_roles, job.role_category)) {
      body = (
        <section className="card setup">
          <h2>This role is not your role</h2>
          <p>{roleMismatchText(profile.profession, job.role_category)}</p>
          <Link href={`/candidate/profile?next=${next}`} className="btn">Update my profile</Link>
        </section>
      );
    } else {
      const details = sentDetails(applicantSnapshot({ name: session.fullName || session.email, email: session.email }, profile ?? {}), profile?.cv_filename, longDate);
      body = (
        <>
          <section className="card">
            {/* A short line with the full list a tap away, so Send is near the top on a phone. */}
            <details className="sentdetails">
              <summary><strong>What the clinic receives:</strong> your resume ({profile?.cv_filename ?? "saved"}), your name, email and the other details on your profile. <span className="linkish">See all details</span></summary>
              <dl className="facts">
                {details.map((d) => (
                  <div key={d.label}><dt>{d.label}</dt><dd>{d.value}</dd></div>
                ))}
              </dl>
              <p className="help"><Link href="/candidate/profile" className="btn sm ghost">Change these in my profile</Link></p>
            </details>
          </section>
          <ApplyForm jobId={job.id} clinicName={clinic} draft={draft?.cover_letter ?? ""} draftSavedAt={draft ? longDate(draft.updated_at) : ""} letters={letters} />
        </>
      );
    }
  }

  return (
    <>
      <SiteHeader session={session} />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="back"><Link href={`/jobs/${job.id}`}>Back to the job</Link></p>
          <h1>Apply to {job.title}</h1>
          <p className="lede2">{clinic} · {job.city}, {job.province} · {payText(job)}</p>
          <div className="stackcards">{body}</div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
