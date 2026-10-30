import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import ReportForm from "@/components/ReportForm";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { getLiveJob } from "@/lib/public-jobs";

export const metadata: Metadata = { title: "Report this job | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function ReportJob({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getLiveJob(id);
  if (!job) notFound();
  return (
    <>
      <SiteHeader session={await getSession()} />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="back"><Link href={`/jobs/${job.id}`}>Back to the job</Link></p>
          <p className="kicker">Report this job</p>
          <h1>{job.title}</h1>
          <p className="lede2">{job.employers?.clinic_name} · {job.city}, {job.province}. Thank you for helping keep Kestrel honest. A person reads every report.</p>
          <ReportForm jobId={job.id} />
        </div>
      </main>
      <AppFooter />
    </>
  );
}
