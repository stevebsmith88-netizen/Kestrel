import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import CandidateProfileForm from "@/components/CandidateProfileForm";
import CvCard from "@/components/CvCard";
import { requireRole } from "@/lib/auth";
import { getMyCandidateProfile } from "@/lib/candidate";
import { longDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "My profile and CV | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("candidate");
  const { notice } = await searchParams;
  const profile = await getMyCandidateProfile(session.userId);
  return (
    <>
      <AppBar session={session} current="/candidate/profile" />
      <main className="app">
        <div className="wrap narrow">
          <p className="kicker">My profile</p>
          <h1>Your profile and CV</h1>
          <p className="lede2">Save your CV once, then apply to any job in a few clicks. Clinics only see your details when you apply to them. Your profile is never public.</p>
          {notice === "cv-deleted" && <p className="notice" role="status">Your CV is deleted.</p>}
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
