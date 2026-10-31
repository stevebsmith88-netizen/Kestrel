import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import CandidateProfileForm from "@/components/CandidateProfileForm";
import CvCard from "@/components/CvCard";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { safeNext } from "@/lib/auth-copy";
import { getMyCandidateProfile, profileReady } from "@/lib/candidate";
import { longDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "My profile and CV | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

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
          <p className="kicker">My profile</p>
          <h1>Your profile and CV</h1>
          <p className="lede2">Save your CV once, then apply to any job in a few clicks. Clinics only see your details when you apply to them. Your profile is never public.</p>
          {notice === "cv-deleted" && <p className="notice" role="status">Your CV is deleted.</p>}
          {back && (
            <section className="card setup" role="status">
              {profileReady(profile) ? (
                <>
                  <h2>You are ready to apply</h2>
                  <p>Your CV and role are saved. Carry on with the job you were looking at.</p>
                  <Link href={back} className="btn">Back to the job</Link>
                </>
              ) : (
                <p>Save your CV and choose your role below, and we will take you back to the job you were applying for.</p>
              )}
            </section>
          )}
          <div className="stackcards">
            <CvCard filename={profile?.cv_filename ?? null} uploadedOn={profile?.cv_uploaded_at ? longDate(profile.cv_uploaded_at) : null} />
            <CandidateProfileForm initial={profile} />
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
