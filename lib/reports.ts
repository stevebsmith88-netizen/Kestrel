// Why someone might report a job. The values are stored, so keep them in step with
// supabase/migrations/0010_job_reports.sql.
export const REPORT_REASONS = [
  { value: "scam", label: "It looks like a scam or a fake job" },
  { value: "recruiter", label: "It is from a recruiter or agency, not the clinic" },
  { value: "discrimination", label: "The wording is discriminatory" },
  { value: "misleading", label: "The pay, location or details look wrong or misleading" },
  { value: "filled", label: "The job has already been filled" },
  { value: "other", label: "Something else" },
] as const;

export const REPORT_REASON_LABEL: Record<string, string> = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]));
