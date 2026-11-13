// Turns the job form into a checked job and a database row. Used by the clinic's own form and by the admin's "post for a clinic" form,
// so both follow exactly the same rules (pay range, the 2 questions, no Canadian experience).
import { payColumns, type PayFields } from "./job-pay.ts";
import { tagsFromRow } from "./job-tags.ts";
import { cleanJob, validateJob } from "./jobs.ts";

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
    payPercentMin: field(form, "payPercentMin"),
    payPercentMax: field(form, "payPercentMax"),
    payPercentOf: field(form, "payPercentOf"),
    payExpectedMin: field(form, "payExpectedMin"),
    payExpectedMax: field(form, "payExpectedMax"),
    payExpectedPeriod: field(form, "payExpectedPeriod"),
    payIsMinimum: field(form, "payIsMinimum"),
    payDays: field(form, "payDays"),
    tagsSoftware: form.getAll("tagsSoftware"),
    tagsEquipment: form.getAll("tagsEquipment"),
    tagsSpecialties: form.getAll("tagsSpecialties"),
  });
  const errors = validateJob(job, submit);
  const row = {
    title: job.title,
    role_category: job.roleCategory || null,
    employment_type: job.employmentType || null,
    province: job.province || null,
    city: job.city || null,
    ...payColumns(job),
    is_existing_vacancy: job.existingVacancy === "yes" ? true : job.existingVacancy === "no" ? false : null,
    uses_ai_screening: job.usesAi === "yes" ? true : job.usesAi === "no" ? false : null,
    description: job.description || null,
    apply_method: job.applyMethod,
    apply_url: job.applyMethod === "external" ? job.applyUrl || null : null,
    work_arrangement: job.workArrangement,
    territory: job.workArrangement === "field" ? job.territory || null : null,
    pay_extras: job.payExtras || null,
    tags_software: job.tagsSoftware,
    tags_equipment: job.tagsEquipment,
    tags_specialties: job.tagsSpecialties,
    status: submit ? "in_review" : "draft",
  };
  return { job, row, errors };
}

type PayAndTagsRow = PayFields & { tags_software?: string[] | null; tags_equipment?: string[] | null; tags_specialties?: string[] | null };

// The pay and tag boxes of the job form, filled in from a saved job or template (for editing, reposting or starting from a template).
export function payAndTagValues(row: PayAndTagsRow | null | undefined) {
  const r = row ?? {};
  const text = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : String(v));
  const tags = tagsFromRow(r);
  return {
    pay_period: r.pay_period ?? "year",
    pay_min: text(r.pay_min),
    pay_max: text(r.pay_max),
    pay_percent_min: text(r.pay_percent_min),
    pay_percent_max: text(r.pay_percent_max),
    pay_percent_of: r.pay_percent_of ?? "",
    pay_expected_min: text(r.pay_expected_min),
    pay_expected_max: text(r.pay_expected_max),
    pay_expected_period: r.pay_expected_period ?? "day",
    pay_is_minimum: r.pay_is_minimum === true ? "yes" : "",
    pay_days: text(r.pay_days_per_week),
    tags_software: tags.software,
    tags_equipment: tags.equipment,
    tags_specialties: tags.specialties,
  };
}
