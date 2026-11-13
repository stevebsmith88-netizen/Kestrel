import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import FirstStepForm from "@/components/FirstStepForm";
import { requireRole } from "@/lib/auth";
import { safeNext } from "@/lib/auth-copy";

export const metadata: Metadata = { title: "Welcome | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// Shown once, straight after a candidate's first sign in (the dashboard sends them here). 3 optional questions and a way to skip.
export default async function CandidateStart({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const session = await requireRole("candidate");
  const { next } = await searchParams;
  return (
    <>
      <AppBar session={session} current="" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Welcome to Kestrel, {session.firstName || "there"}</h1>
          <p className="lede2">A few quick questions help us show you the right jobs first. All of them are optional, and you can change them later in your profile.</p>
          <FirstStepForm next={next ? safeNext(next, "") || undefined : undefined} />
        </div>
      </main>
      <AppFooter />
    </>
  );
}
