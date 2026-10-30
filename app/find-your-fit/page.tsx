import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findYourFitOn } from "@/lib/features";
import AppFooter from "@/components/AppFooter";
import FitQuiz from "@/components/FitQuiz";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Find your fit in eye care | Kestrel Eye Care Jobs",
  description: "A 2 minute quiz that points you to the eye care roles in Canada that suit the way you like to work.",
  alternates: { canonical: "/find-your-fit" },
};

export default async function FindYourFit() {
  // Built, but switched off until Steve has decided how it should look (ENABLE_FIND_YOUR_FIT=yes in Vercel).
  if (!findYourFitOn()) notFound();
  const session = await getSession();
  return (
    <>
      <SiteHeader session={session} />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Find your fit</p>
          <h1>Which eye care role suits you?</h1>
          <p className="lede2">6 short questions, about 2 minutes. We will suggest roles that match how you like to work, and show you the jobs.</p>
          <FitQuiz signedInAs={session ? (session.role === "candidate" ? "candidate" : "other") : null} />
        </div>
      </main>
      <AppFooter />
    </>
  );
}
