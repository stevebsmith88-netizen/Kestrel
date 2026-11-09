"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import type { QuickState } from "@/lib/dashboard-notices";
import { getMyEmployer } from "@/lib/clinic";
import { updateThenInsert } from "@/lib/save-helpers";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idFrom = (form: FormData) => {
  const id = String(form.get("id") ?? "");
  return UUID.test(id) ? id : null;
};

// Keeps a job (live, closed or any other) as a template, named after the job.
async function doSaveTemplate(form: FormData) {
  const session = await requireRole("clinic");
  const id = idFrom(form);
  const employer = await getMyEmployer(session.userId);
  const db = await supabaseServer();
  if (!id || !db || !employer) return "template-failed";
  const { data: job } = await db
    .from("jobs")
    .select("title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, description, apply_method, apply_url, work_arrangement, territory, pay_extras")
    .eq("id", id)
    .eq("employer_id", employer.id)
    .maybeSingle();
  if (!job) return "template-failed";
  const name = job.title.slice(0, 80);
  const { error } = await updateThenInsert(db, "job_templates", { employer_id: employer.id, name }, { ...job }, { employer_id: employer.id, name, ...job });
  if (error) {
    console.error("Template save failed:", error.code, error.message);
    return /20 templates/.test(error.message) ? "template-limit" : "template-failed";
  }
  revalidatePath("/clinic");
  return "template-saved";
}

export async function saveJobAsTemplate(form: FormData) {
  redirect(`/clinic?notice=${await doSaveTemplate(form)}`);
}

// The dashboard button: saves in place and shows the message without leaving the page (see lib/clinic-actions.ts).
export async function saveJobAsTemplateQuiet(_prev: QuickState, form: FormData): Promise<QuickState> {
  const notice = await doSaveTemplate(form);
  revalidatePath("/clinic");
  return { notice };
}

export async function deleteTemplate(form: FormData) {
  await requireRole("clinic");
  const id = idFrom(form);
  const db = await supabaseServer();
  if (id && db) await db.from("job_templates").delete().eq("id", id);
  revalidatePath("/clinic/jobs/new");
  redirect("/clinic/jobs/new?notice=template-deleted");
}
