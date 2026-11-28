import type { JobStatus } from "@/lib/jobs";

export type AdminJob = {
  id: string;
  title: string;
  status: JobStatus;
  role_category: string | null;
  city: string;
  province: string;
  posted_at: string | null;
  expires_at: string | null;
  updated_at: string;
  employers: { clinic_name: string } | null;
};
export type AdminPayment = { status: string; amount_cents: number; band: string; failure_message: string | null };
