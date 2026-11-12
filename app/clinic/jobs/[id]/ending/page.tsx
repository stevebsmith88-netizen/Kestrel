import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import FilledViaFields from "@/components/FilledViaFields";
import { requireRole } from "@/lib/auth";
import { fillRole } from "@/lib/applicant-actions";
import { getApplicantCounts, getHireCandidates, getMyJob } from "@/lib/clinic";
import { extendJob } from "@/lib/clinic-actions";
import { EXTEND_GRACE_DAYS, EXTEND_WINDOW_DAYS, FILL_SOURCES, canExtend, extendedUntil } from "@/lib/job-ending";
import { longDate } from "@/lib/jobs";
import { IN_TALKS } from "@/lib/still-talking";

export const metadata: Metadata = { title: "Filled, or still hiring? | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = 24 * 60 * 60 * 1000;

const NOTICES: Record<string, string> = {
  "job-extend-quebec": "This job is in Quebec, and Kestrel can't post jobs in Quebec yet, so it can't be extended. Quebec is planned for a later date.",
  "job-extend-blocked": "This job can't be extended right now. A live job can be extended in its last 7 days, and an ended one within 7 days of ending.",
  "job-extend-failed": "We couldn't extend the job. Please try again, or email us and we'll do it for you.",
};

// Where the closing soon email lands. The clinic answers one question: filled (and how), or still hiring.
export default async function JobEnding({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("clinic");
  const { id } = await params;
  const { notice } = await searchParams;
  if (!UUID.test(id)) notFound();
  const job = await getMyJob(id);
  if (!job) notFound();
  const counts = await getApplicantCounts();
  const waiting = counts[id]?.waiting ?? 0;
  const hireCandidates = await getHireCandidates(id);
  // The people at Interview or Offer, listed with a message each (P1-13).
  const talking = hireCandidates.filter((c) => (IN_TALKS as readonly string[]).includes(c.status));
  const now = new Date();
  const extendable = canExtend(job, now);
  const ended = job.status === "expired" || job.status === "closed";
  const ends = job.expires_at ? longDate(job.expires_at) : null;

  let when: string;
  if (job.status === "live" && ends) when = `It comes down on ${ends}, after its 30 days.`;
  else if (job.status === "expired" && ends) when = `It came down on ${ends}.`;
  else if (job.status === "closed") when = "This job is closed.";
  else when = "This job is not live.";

  let extendNote: string | null = null;
  if (!extendable && job.status === "live" && job.expires_at) {
    extendNote = `You can extend it from ${longDate(new Date(new Date(job.expires_at).getTime() - EXTEND_WINDOW_DAYS * DAY).toISOString())}, in its last ${EXTEND_WINDOW_DAYS} days.`;
  } else if (!extendable && job.status === "expired") {
    extendNote = `It ended more than ${EXTEND_GRACE_DAYS} days ago, so it can't be extended. Use Post again on your dashboard, and your details are kept.`;
  }

  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="back"><Link href="/clinic">Back to your dashboard</Link></p>
          <p className="kicker">Your job</p>
          <h1>{job.title}</h1>
          <p>{when}</p>
          {notice && NOTICES[notice] && <p className="notice" role="status">{NOTICES[notice]}</p>}

          <div className="stackcards">
            <form action={fillRole} className="card stackform">
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="from" value="ending" />
              <h2>Filled it?</h2>
              <FilledViaFields sources={FILL_SOURCES} candidates={hireCandidates} idPrefix="end" talking={talking} clinicName={hireCandidates[0]?.clinicName ?? ""} />
              <p className="help">
                {ended ? "We'll save your answer. " : "This closes the job. "}
                {waiting > 0
                  ? `The ${waiting} ${waiting === 1 ? "person" : "people"} still waiting will hear, kindly, that the role is filled.${talking.length > 0 ? " So will the people you are still talking to, with the messages above." : ""}`
                  : talking.length > 0 ? "The people you are still talking to will hear, with the messages above." : "Your answer helps us make Kestrel better for clinics like yours."}
              </p>
              <div><button type="submit" className="btn">{ended ? "Save my answer" : "Yes, it's filled"}</button></div>
            </form>

            {job.status !== "closed" && (
              <section className="card">
                <h2>Still hiring?</h2>
                {extendable ? (
                  <form action={extendJob} className="stackform">
                    <input type="hidden" name="id" value={job.id} />
                    <input type="hidden" name="from" value="ending" />
                    <p>Extend it for another 30 days, to {longDate(extendedUntil(job, now).toISOString())}. It goes straight back up with the same wording, so there&apos;s no need to post it again. Extending is free while we launch.</p>
                    <div><button type="submit" className="btn">Extend for 30 days</button></div>
                  </form>
                ) : (
                  <p>{extendNote}</p>
                )}
                {job.status === "live" && <p className="help">Or do nothing, and it comes down on {ends}. Applicants stay in your dashboard either way.</p>}
              </section>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
