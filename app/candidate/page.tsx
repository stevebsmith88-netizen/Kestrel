import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Your home | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function CandidateHome() {
  const session = await requireRole("candidate");
  const first = session.firstName || "there";
  return (
    <>
      <AppBar session={session} />
      <main className="app">
        <div className="wrap">
          <p className="kicker">Your home</p>
          <h1>Welcome, {first}</h1>
          <p className="lede2">Your account is ready. We are still building Kestrel, so job search, saved CVs and application tracking are not open yet. If you agreed to updates when you signed up, we will email you the moment they are.</p>
          <div className="tiles">
            <section className="card">
              <p className="kicker">Applications</p>
              <h2>Track every role</h2>
              <p>Once job search opens, each application you send will appear here with its progress, from applied to offer.</p>
            </section>
            <section className="card">
              <p className="kicker">Your CV</p>
              <h2>Save it once</h2>
              <p>Upload your CV once and apply in a few clicks, with a short cover letter for each job.</p>
            </section>
            <section className="card">
              <p className="kicker">Job alerts</p>
              <h2>Hear first</h2>
              <p>Tell us the roles and provinces you care about and we will email you when a match is posted.</p>
            </section>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
