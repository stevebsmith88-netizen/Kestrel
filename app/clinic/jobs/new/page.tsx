import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import JobForm from "@/components/JobForm";
import { requireRole } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";

export const metadata: Metadata = { title: "Post a job | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function NewJob() {
  const session = await requireRole("clinic");
  const employer = await getMyEmployer(session.userId);
  if (!employer) redirect("/clinic/profile");
  return (
    <>
      <AppBar session={session} current="/clinic/jobs/new" />
      <main className="app">
        <div className="wrap narrow">
          <p className="kicker">{employer.clinic_name}</p>
          <h1>Post a job</h1>
          <p className="lede2">About 5 minutes. You can save a draft and come back to it.</p>
          <JobForm
            initial={{
              title: "", role_category: "", employment_type: "", province: employer.province, city: employer.city,
              pay_period: "year", pay_min: "", pay_max: "", is_existing_vacancy: "", uses_ai_screening: "",
              description: "", apply_method: "kestrel", apply_url: "",
            }}
          />
        </div>
      </main>
      <AppFooter />
    </>
  );
}
