import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EmployerPage from "@/components/EmployerPage";
import { companyHref, clinicIndexable, openJobsText } from "@/lib/clinic-pages";
import { getPublicClinic } from "@/lib/public-clinics";
import { listLiveJobsForEmployer } from "@/lib/public-jobs";
import { shareMetadata } from "@/lib/share";

// A supplier's or manufacturer's public page (Steve, 14th November 2026): who they are and every job they have open, often field based.
// Saved and shared like job pages, and cleared when a job or an employer changes (lib/job-cache.ts).
export const revalidate = 300;
export const dynamic = "force-static";
export const generateStaticParams = () => [];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const found = await getPublicClinic((await params).slug, "supplier");
  if (!found) return { title: "Company not found | Kestrel Eye Care Jobs", robots: { index: false } };
  const { clinic, slug } = found;
  const jobs = await listLiveJobsForEmployer(clinic.id);
  const where = `${clinic.city}, ${clinic.province}`;
  return {
    ...shareMetadata({
      title: `${clinic.clinic_name}, ${where}: eye care jobs`,
      shareTitle: `Work at ${clinic.clinic_name}`,
      description: `${clinic.clinic_name} in ${where}. ${openJobsText(jobs.length)} on Kestrel Eye Care Jobs, every one with its pay.`,
      path: companyHref(slug),
    }),
    ...(clinicIndexable(clinic.about, jobs.length) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const found = await getPublicClinic((await params).slug, "supplier");
  if (!found) notFound();
  return <EmployerPage clinic={found.clinic} slug={found.slug} jobs={await listLiveJobsForEmployer(found.clinic.id)} confirmed={found.confirmed} />;
}
