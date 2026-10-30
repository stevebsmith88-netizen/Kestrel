import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import JobForm from "@/components/JobForm";
import { requireRole } from "@/lib/auth";
import { getMyEmployer, getMyTemplate, getMyTemplates } from "@/lib/clinic";
import { longDate } from "@/lib/jobs";
import { deleteTemplate } from "@/lib/template-actions";

export const metadata: Metadata = { title: "Post a job | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NewJob({ searchParams }: { searchParams: Promise<{ template?: string; notice?: string }> }) {
  const session = await requireRole("clinic");
  const { template: templateId, notice } = await searchParams;
  const employer = await getMyEmployer(session.userId);
  if (!employer) redirect("/clinic/profile?from=post");
  const templates = await getMyTemplates();
  const start = templateId && UUID.test(templateId) ? await getMyTemplate(templateId) : null;
  return (
    <>
      <AppBar session={session} current="/clinic/jobs/new" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">{employer.clinic_name}</p>
          <h1>Post a job</h1>
          <p className="lede2">About 5 minutes. You can save a draft and come back to it from your dashboard.</p>
          {notice === "template-deleted" && <p className="notice" role="status">Template deleted.</p>}

          {start ? (
            <p className="note">
              <strong>Started from your template: {start.name}.</strong> Check every detail, and answer the two questions again for this post. <Link href="/clinic/jobs/new">Start blank instead</Link>
            </p>
          ) : templates.length > 0 ? (
            <section className="card" aria-labelledby="tpl-h">
              <h2 id="tpl-h">Start from a template</h2>
              <p className="help">Your saved posts. Pick one and the form is filled in for you.</p>
              <ul className="alertlist">
                {templates.map((t) => (
                  <li key={t.id}>
                    <span>
                      <strong>{t.name}</strong><br />
                      <span className="help">{[t.role_category, t.city && t.province ? `${t.city}, ${t.province}` : null, `saved ${longDate(t.updated_at)}`].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="jobactions">
                      <Link href={`/clinic/jobs/new?template=${t.id}`} className="btn sm">Use this</Link>
                      <form action={deleteTemplate}><input type="hidden" name="id" value={t.id} /><button type="submit" className="linkbtn">Delete</button></form>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="help">Or fill in the form below to start from scratch.</p>
            </section>
          ) : null}

          <JobForm
            key={start?.id ?? "blank"}
            adBuilder={Boolean(process.env.ANTHROPIC_API_KEY)}
            initial={{
              title: start?.title ?? "",
              role_category: start?.role_category ?? "",
              employment_type: start?.employment_type ?? "",
              province: start?.province ?? employer.province,
              city: start?.city ?? employer.city,
              pay_period: start?.pay_period ?? "year",
              pay_min: start?.pay_min?.toString() ?? "",
              pay_max: start?.pay_max?.toString() ?? "",
              is_existing_vacancy: "",
              uses_ai_screening: "",
              description: start?.description ?? "",
              apply_method: start?.apply_method ?? "kestrel",
              apply_url: start?.apply_url ?? "",
              work_arrangement: start?.work_arrangement ?? "on_site",
              territory: start?.territory ?? "",
              pay_extras: start?.pay_extras ?? "",
            }}
          />
        </div>
      </main>
      <AppFooter />
    </>
  );
}
