import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EmployerPage from "@/components/EmployerPage";
import { clinicHref, clinicIndexable, openJobsText } from "@/lib/clinic-pages";
import { getPublicClinic } from "@/lib/public-clinics";
import { listLiveJobsForEmployer } from "@/lib/public-jobs";
import { shareMetadata } from "@/lib/share";

// A clinic's public page: who they are and every job they have open (Steve, 14th November 2026). Saved and shared for up to 5 minutes and
// cleared at once when a job or a clinic changes (lib/job-cache.ts), like job pages, so it never holds anything about the person looking.
export const revalidate = 300;
export const dynamic = "force-static";
export const generateStaticParams = () => [];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const found = await getPublicClinic((await params).slug);
  if (!found) return { title: "Clinic not found | Kestrel Eye Care Jobs", robots: { index: false } };
  const { clinic, slug } = found;
  const jobs = await listLiveJobsForEmployer(clinic.id);
  const where = `${clinic.city}, ${clinic.province}`;
  return {
    ...shareMetadata({
      title: `${clinic.clinic_name}, ${where}: eye care jobs`,
      shareTitle: `Work at ${clinic.clinic_name}`,
      description: `${clinic.clinic_name} in ${where}. ${openJobsText(jobs.length)} on Kestrel Eye Care Jobs, every one with its pay.`,
      path: clinicHref(slug),
    }),
    ...(clinicIndexable(clinic.about, jobs.length) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function ClinicPage({ params }: { params: Promise<{ slug: string }> }) {
  const found = await getPublicClinic((await params).slug);
  if (!found) notFound();
  return <EmployerPage clinic={found.clinic} slug={found.slug} jobs={await listLiveJobsForEmployer(found.clinic.id)} />;
}
