import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import JobForm from "@/components/JobForm";
import { requireRole } from "@/lib/auth";
import { getMyJob } from "@/lib/clinic";

export const metadata: Metadata = { title: "Edit job | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditJob({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("clinic");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const job = await getMyJob(id);
  if (!job) notFound();
  const editable = job.status === "draft" || job.status === "rejected";
  const yesNo = (v: boolean | null) => (v === true ? "yes" : v === false ? "no" : "");

  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Your job</p>
          <h1>{job.title}</h1>
          {job.status === "rejected" && job.review_note && (
            <p className="note"><strong>What to change:</strong> {job.review_note}</p>
          )}
          {!editable ? (
            <section className="card">
              <p>This job is {job.status === "live" ? "live" : job.status === "in_review" ? "with our team" : job.status} and can&apos;t be edited here.</p>
              <p><Link href="/clinic" className="btn">Back to your dashboard</Link></p>
            </section>
          ) : (
            <JobForm
            adBuilder={Boolean(process.env.ANTHROPIC_API_KEY)}
              initial={{
                id: job.id,
                title: job.title,
                role_category: job.role_category ?? "",
                employment_type: job.employment_type ?? "",
                province: job.province ?? "",
                city: job.city ?? "",
                pay_period: job.pay_period ?? "year",
                pay_min: job.pay_min?.toString() ?? "",
                pay_max: job.pay_max?.toString() ?? "",
                is_existing_vacancy: yesNo(job.is_existing_vacancy),
                uses_ai_screening: yesNo(job.uses_ai_screening),
                description: job.description ?? "",
                apply_method: job.apply_method,
                apply_url: job.apply_url ?? "",
              }}
            />
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
