import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import ApplyForm from "@/components/ApplyForm";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { getMyCandidateProfile, profileReady } from "@/lib/candidate";
import { formatPay } from "@/lib/jobs";
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
        <p>Create a free account, save your CV once, and apply to any job in a few clicks.</p>
        <div className="formbtns">
          <Link href={`/sign-in?next=${next}`} className="btn">Sign in</Link>
          <Link href="/sign-up" className="btn ghost">Create a free account</Link>
        </div>
      </section>
    );
  } else if (session.role !== "candidate") {
    body = <section className="card"><p>Applying is for candidate accounts. You are signed in as a {session.role === "clinic" ? "clinic" : "admin"}.</p></section>;
  } else {
    const profile = await getMyCandidateProfile(session.userId);
    const db = await supabaseServer();
    const { data: existing } = db ? await db.from("applications").select("id").eq("job_id", job.id).maybeSingle() : { data: null };
    if (existing) {
      body = <section className="card"><h2>You have already applied</h2><p>You can follow this application under My applications.</p><Link href={`/candidate/applications/${existing.id}`} className="btn">See my application</Link></section>;
    } else if (!profileReady(profile)) {
      body = (
        <section className="card setup">
          <h2>One thing first</h2>
          <p>Save your CV and choose your role, and then you can apply in a few clicks.</p>
          <Link href="/candidate/profile" className="btn">Complete my profile</Link>
        </section>
      );
    } else {
      body = (
        <>
          <section className="card">
            <h2>Your details</h2>
            <dl className="facts">
              <div><dt>Name</dt><dd>{session.fullName || session.email}</dd></div>
              <div><dt>Email</dt><dd>{session.email}</dd></div>
              <div><dt>Role</dt><dd>{profile?.profession}</dd></div>
              <div><dt>CV</dt><dd>{profile?.cv_filename}</dd></div>
            </dl>
            <p className="help"><Link href="/candidate/profile">Change these in my profile</Link></p>
          </section>
          <ApplyForm jobId={job.id} clinicName={clinic} />
        </>
      );
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="app">
        <div className="wrap narrow">
          <p className="back"><Link href={`/jobs/${job.id}`}>Back to the job</Link></p>
          <p className="kicker">Easy Apply</p>
          <h1>Apply to {job.title}</h1>
          <p className="lede2">{clinic} · {job.city}, {job.province} · {formatPay(job.pay_min, job.pay_max, job.pay_period)}</p>
          <div className="stackcards">{body}</div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
