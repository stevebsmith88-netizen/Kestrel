// Turns the job form into a checked job and a database row. Used by the clinic's own form and by the admin's "post for a clinic" form,
// so both follow exactly the same rules (pay range, the 2 questions, no Canadian experience).
import { cleanJob, parseMoney, validateJob } from "./jobs.ts";

const field = (form: FormData, key: string) => form.get(key) ?? "";

export function jobFromForm(form: FormData, submit: boolean) {
  const job = cleanJob({
    title: field(form, "title"),
    roleCategory: field(form, "roleCategory"),
    employmentType: field(form, "employmentType"),
    province: field(form, "province"),
    city: field(form, "city"),
    payPeriod: field(form, "payPeriod"),
    payMin: field(form, "payMin"),
    payMax: field(form, "payMax"),
    existingVacancy: field(form, "existingVacancy"),
    usesAi: field(form, "usesAi"),
    description: field(form, "description"),
    applyMethod: field(form, "applyMethod"),
    applyUrl: field(form, "applyUrl"),
    workArrangement: field(form, "workArrangement"),
    territory: field(form, "territory"),
    payExtras: field(form, "payExtras"),
  });
  const errors = validateJob(job, submit);
  const row = {
    title: job.title,
    role_category: job.roleCategory || null,
    employment_type: job.employmentType || null,
    province: job.province || null,
    city: job.city || null,
    pay_period: job.payPeriod || null,
    pay_min: parseMoney(job.payMin),
    pay_max: parseMoney(job.payMax),
    is_existing_vacancy: job.existingVacancy === "yes" ? true : job.existingVacancy === "no" ? false : null,
    uses_ai_screening: job.usesAi === "yes" ? true : job.usesAi === "no" ? false : null,
    description: job.description || null,
    apply_method: job.applyMethod,
    apply_url: job.applyMethod === "external" ? job.applyUrl || null : null,
    work_arrangement: job.workArrangement,
    territory: job.workArrangement === "field" ? job.territory || null : null,
    pay_extras: job.payExtras || null,
    status: submit ? "in_review" : "draft",
  };
  return { job, row, errors };
}
