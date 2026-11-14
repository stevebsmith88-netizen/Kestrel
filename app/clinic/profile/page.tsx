import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import ClinicProfileForm from "@/components/ClinicProfileForm";
import { requireRole } from "@/lib/auth";
import { getMyClinics, getMyEmployer } from "@/lib/clinic";
import LocationPicker from "@/components/LocationPicker";
import { practiceLabel } from "@/lib/jobs";
import { OWNER_ONLY_TEXT } from "@/lib/team";

export const metadata: Metadata = { title: "Clinic profile | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function ClinicProfile({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await requireRole("clinic");
  const { from } = await searchParams;
  const employer = await getMyEmployer(session.userId);
  const clinics = employer ? await getMyClinics(session.userId) : [];
  return (
    <>
      <AppBar session={session} current="/clinic/profile" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>{employer ? "Your clinic" : "Set up your clinic"}</h1>
          {employer && <LocationPicker clinics={clinics} current={employer.id} back="/clinic/profile" />}
          {!employer && from === "post" && (
            <p className="note" role="status"><strong>You must set up your clinic before posting a job.</strong> It takes about 2 minutes. When you save it, you can post your first job straight away.</p>
          )}
          {employer && employer.level !== "owner" ? (
            <>
              <p className="lede2">This is what candidates see on your clinic&apos;s job posts. {OWNER_ONLY_TEXT}</p>
              <dl className="facts card">
                <div><dt>Name</dt><dd>{employer.clinic_name}</dd></div>
                <div><dt>Type</dt><dd>{practiceLabel(employer.practice_type)}</dd></div>
                <div><dt>Location</dt><dd>{employer.city}, {employer.province}</dd></div>
                {employer.website && <div><dt>Website</dt><dd>{employer.website}</dd></div>}
                {employer.about && <div className="wide"><dt>About</dt><dd className="adbody">{employer.about}</dd></div>}
              </dl>
            </>
          ) : (
            <>
              <p className="lede2">This is what candidates see on your job posts, apart from your alert email, which stays private.</p>
              <ClinicProfileForm initial={employer} signUpEmail={session.email} />
            </>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
