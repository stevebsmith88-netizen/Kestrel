import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import ClinicProfileForm from "@/components/ClinicProfileForm";
import { requireRole } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";

export const metadata: Metadata = { title: "Clinic profile | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function ClinicProfile() {
  const session = await requireRole("clinic");
  const employer = await getMyEmployer(session.userId);
  return (
    <>
      <AppBar session={session} current="/clinic/profile" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Clinic profile</p>
          <h1>{employer ? "Your clinic" : "Set up your clinic"}</h1>
          <p className="lede2">This is what candidates see on your job posts, apart from your alert email, which stays private.</p>
          <ClinicProfileForm initial={employer} />
        </div>
      </main>
      <AppFooter />
    </>
  );
}
