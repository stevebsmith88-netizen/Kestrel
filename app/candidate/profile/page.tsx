import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import CandidateProfileForm from "@/components/CandidateProfileForm";
import CvCard from "@/components/CvCard";
import ResumeReader from "@/components/ResumeReader";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { safeNext } from "@/lib/auth-copy";
import { getMyCandidateProfile, profileReady } from "@/lib/candidate";
import { APPLY_NEEDS } from "@/lib/profile-ready";
import { longDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "My profile and resume | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";
// The longest any action on this page may run (saving the profile, uploading a resume, Read my resume). A backstop behind the resume
// reader's own limits in lib/resume-text.ts: if something still runs away, the server stops it at 30 seconds.
export const maxDuration = 30;

export default async function CandidateProfilePage({ searchParams }: { searchParams: Promise<{ notice?: string; next?: string }> }) {
  const session = await requireRole("candidate");
  const { notice, next } = await searchParams;
  const profile = await getMyCandidateProfile(session.userId);
  // Someone sent here from a job they were applying to is offered the way back as soon as the profile is ready.
  const back = next ? safeNext(next, "") : "";
  return (
    <>
      <AppBar session={session} current="/candidate/profile" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Your profile and resume</h1>
          <p className="lede2">Save your resume once, then apply to any job in a few clicks. Your profile is private. A clinic sees only what you send with an application.</p>
          {notice === "cv-deleted" && <p className="notice" role="status">Your resume is deleted.</p>}
          {back && (
            <section className="card setup" role="status">
              {profileReady(profile) ? (
                <>
                  <h2>You are ready to apply</h2>
                  <p>Your role, resume and town are saved. Carry on with the job you were looking at.</p>
                  <Link href={back} className="btn">Back to the job</Link>
                </>
              ) : (
                <p>Add what is still needed below, and we will take you back to the job you were applying for.</p>
              )}
            </section>
          )}
          <section className="card applycheck" aria-labelledby="ac-h">
            <h2 id="ac-h">{profileReady(profile) ? "You are ready to apply" : "To apply you need 3 things"}</h2>
            <ul className="applyneeds">
              {APPLY_NEEDS.map((n) => {
                const done = n.done(profile);
                return <li key={n.key} className={done ? "done" : "todo"}><span>{n.label}</span><span className="state">{done ? "Done" : "Still needed"}</span></li>;
              })}
            </ul>
          </section>
          <div className="stackcards">
            <CvCard filename={profile?.cv_filename ?? null} uploadedOn={profile?.cv_uploaded_at ? longDate(profile.cv_uploaded_at) : null} />
            {/* Keyed by the upload time, so a new resume starts the reader afresh instead of showing the old file's suggestions (D-03). */}
            {profile?.cv_path && <ResumeReader key={`${profile.cv_path}|${profile.cv_uploaded_at ?? ""}`} />}
            <CandidateProfileForm key={JSON.stringify(profile)} initial={profile} />
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
