"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";
import { updateThenInsert } from "@/lib/save-helpers";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idFrom = (form: FormData) => {
  const id = String(form.get("id") ?? "");
  return UUID.test(id) ? id : null;
};

// Keeps a job (live, closed or any other) as a template, named after the job.
export async function saveJobAsTemplate(form: FormData) {
  const session = await requireRole("clinic");
  const id = idFrom(form);
  const employer = await getMyEmployer(session.userId);
  const db = await supabaseServer();
  if (!id || !db || !employer) redirect("/clinic");
  const { data: job } = await db
    .from("jobs")
    .select("title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, description, apply_method, apply_url, work_arrangement, territory, pay_extras")
    .eq("id", id)
    .eq("employer_id", employer.id)
    .maybeSingle();
  if (!job) redirect("/clinic");
  const name = job.title.slice(0, 80);
  const { error } = await updateThenInsert(db, "job_templates", { employer_id: employer.id, name }, { ...job }, { employer_id: employer.id, name, ...job });
  if (error) {
    console.error("Template save failed:", error.code, error.message);
    redirect(`/clinic?notice=${/20 templates/.test(error.message) ? "template-limit" : "template-failed"}`);
  }
  revalidatePath("/clinic");
  redirect("/clinic?notice=template-saved");
}

export async function deleteTemplate(form: FormData) {
  await requireRole("clinic");
  const id = idFrom(form);
  const db = await supabaseServer();
  if (id && db) await db.from("job_templates").delete().eq("id", id);
  revalidatePath("/clinic/jobs/new");
  redirect("/clinic/jobs/new?notice=template-deleted");
}
