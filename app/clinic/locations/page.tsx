import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import ClinicProfileForm from "@/components/ClinicProfileForm";
import { requireRole } from "@/lib/auth";
import { getMyClinics, getMyEmployer } from "@/lib/clinic";
import { switchLocation } from "@/lib/location-actions";
import { levelLabel } from "@/lib/team";

export const metadata: Metadata = { title: "Your locations | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// My clinic, Locations (phase B, migration 0047). An owner adds locations; each has its own name, town, public page, jobs and team.
export default async function Locations() {
  const session = await requireRole("clinic");
  const current = await getMyEmployer(session.userId);
  if (!current) redirect("/clinic/profile");
  const clinics = await getMyClinics(session.userId);
  const owns = clinics.some((c) => c.level === "owner");
  return (
    <>
      <AppBar session={session} current="/clinic/locations" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Your locations</h1>
          <p className="lede2">Each location has its own profile, public page, jobs and team. Pick the one you want to work in; your dashboard, jobs, applicants and team follow it.</p>
          <ul className="teamlist">
            {clinics.map((c) => (
              <li key={c.id} className="card">
                <div>
                  <strong>{c.clinic_name}</strong>
                  <p className="meta">{c.city}, {c.province} · {levelLabel(c.level)}{c.id === current.id ? " · working in it now" : ""}</p>
                </div>
                {c.id !== current.id && (
                  <form action={switchLocation}>
                    <input type="hidden" name="location" value={c.id} />
                    <input type="hidden" name="back" value="/clinic" />
                    <button type="submit" className="btn sm ghost">Work in this location</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {owns ? (
            <section className="teaminvite">
              <h2>Add a location</h2>
              <p className="help">For another clinic you own. It gets its own public page and its own jobs, and you can invite a team to it. Up to 25 locations on 1 account.</p>
              <ClinicProfileForm initial={null} signUpEmail={current.level === "owner" ? current.notify_email : session.email} newLocation />
            </section>
          ) : (
            <p className="help">Only a clinic&apos;s owner can add locations.</p>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
