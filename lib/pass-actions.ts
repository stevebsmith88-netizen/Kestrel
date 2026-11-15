"use server";

import { postingOn } from "@/lib/features";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getMyEditableEmployer, getMyEmployer } from "@/lib/clinic";
import { applyPassForSubmit, confirmSinglePost, getActivePass, moveToReview, openBillingPortal, passesAvailable, slotsUsed, startPassCheckout, switchPassPlan } from "@/lib/pass-flow";
import { passDecision } from "@/lib/passes";
import { supabaseAdmin } from "@/lib/supabase-server";

// The Plans page buttons. Only the clinic owner can start, change or cancel a pass, and only for the location they are working in.
async function owner() {
  const session = await requireRole("clinic");
  const employer = await getMyEmployer(session.userId);
  if (!employer) redirect("/clinic/profile");
  if (!passesAvailable() || !postingOn()) redirect("/clinic");
  if (employer.level !== "owner") redirect("/clinic/plans?problem=owner");
  return employer;
}

export async function choosePlan(form: FormData) {
  const employer = await owner();
  const result = await startPassCheckout(employer.id, String(form.get("plan") ?? ""), form.get("interval") === "year" ? "year" : "month");
  if ("url" in result) redirect(result.url);
  redirect(`/clinic/plans?problem=${result.error}${result.detail ? `&why=${encodeURIComponent(result.detail.slice(0, 200))}` : ""}`);
}

export async function manageBilling() {
  const employer = await owner();
  const result = await openBillingPortal(employer.id);
  if ("url" in result) redirect(result.url);
  redirect(`/clinic/plans?problem=portal&why=${encodeURIComponent(result.error.slice(0, 200))}`);
}

// The confirm page buttons (lib/pass-flow.ts, app/clinic/jobs/[id]/confirm). A job the pass cannot cover is not sent or charged until the clinic chooses.
async function draftJob(form: FormData) {
  const session = await requireRole("clinic");
  const employer = await getMyEditableEmployer(session.userId);
  if (!employer) redirect("/clinic");
  if (!passesAvailable() || !postingOn()) redirect("/clinic");
  const id = String(form.get("id") ?? "");
  const db = supabaseAdmin();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/clinic");
  const { data: job } = await db.from("jobs").select("id, title, role_category, employer_id, status").eq("id", id).maybeSingle();
  if (!job || job.employer_id !== employer.id || job.status !== "draft") redirect("/clinic");
  return { db, employer, job: job as { id: string; title: string; role_category: string | null; employer_id: string } };
}

export async function chooseSinglePost(form: FormData) {
  const { db, employer, job } = await draftJob(form);
  const pass = await getActivePass(db, employer.id);
  if (!pass) redirect(`/clinic/jobs/${job.id}`);
  const decision = passDecision(pass.plan, job.role_category, await slotsUsed(db, employer.id));
  if (decision.kind === "covered") redirect(`/clinic/jobs/${job.id}/confirm`);
  if (!(await confirmSinglePost(db, job, employer.clinic_name))) redirect(`/clinic/jobs/${job.id}/confirm?problem=card`);
  await moveToReview(db, job, employer.clinic_name);
  revalidatePath("/clinic");
  redirect(`/clinic?notice=${decision.kind === "full" ? "job-submitted-pass-full" : "job-submitted-pass-role"}`);
}

export async function chooseSwitchToPlus(form: FormData) {
  const { db, employer, job } = await draftJob(form);
  if (employer.level !== "owner") redirect(`/clinic/jobs/${job.id}/confirm?problem=owner`);
  const switched = await switchPassPlan(employer.id, "clinic_pass_plus");
  if (!switched.ok) redirect(`/clinic/jobs/${job.id}/confirm?problem=switch&why=${encodeURIComponent(switched.message.slice(0, 240))}`);
  const outcome = await applyPassForSubmit(db, job, employer.clinic_name);
  if (outcome.kind !== "covered") redirect(`/clinic/jobs/${job.id}/confirm`);
  await moveToReview(db, job, employer.clinic_name);
  revalidatePath("/clinic");
  redirect("/clinic?notice=job-submitted-pass");
}
