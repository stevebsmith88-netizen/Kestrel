import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Your dashboard | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function ClinicHome() {
  const session = await requireRole("clinic");
  const first = session.firstName || "there";
  return (
    <>
      <AppBar session={session} />
      <main className="app">
        <div className="wrap">
          <p className="kicker">Clinic dashboard</p>
          <h1>Welcome, {first}</h1>
          <p className="lede2">Your clinic account is ready. We are still building Kestrel, so posting jobs, reviewing applicants and your clinic profile are not open yet. If you agreed to updates when you signed up, we will email you the moment they are.</p>
          <div className="tiles">
            <section className="card">
              <p className="kicker">Postings</p>
              <h2>Post a job</h2>
              <p>Write your ad in minutes, add the pay range, and reach eye care professionals across Canada.</p>
            </section>
            <section className="card">
              <p className="kicker">Applicants</p>
              <h2>Review with ease</h2>
              <p>See each applicant&apos;s CV and cover letter, and move them through your hiring steps.</p>
            </section>
            <section className="card">
              <p className="kicker">Clinic profile</p>
              <h2>Tell your story</h2>
              <p>Add your logo, team photos and benefits so candidates get to know you before they apply.</p>
            </section>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
