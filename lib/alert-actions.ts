"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { PRACTICE_TYPES, PROVINCES, ROLE_CATEGORIES, type JobFormState } from "@/lib/jobs";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function createAlert(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate");
  const role = text(form, "role");
  const province = text(form, "province");
  const practice = text(form, "practice");
  if (role && !(ROLE_CATEGORIES as readonly string[]).includes(role)) return { error: "Choose one of the roles in the list." };
  if (province && !(PROVINCES as readonly string[]).includes(province)) return { error: "Choose one of the provinces in the list." };
  if (practice && !PRACTICE_TYPES.some((p) => p.value === practice)) return { error: "Choose independent or corporate, or leave it as any." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const { error } = await db.from("job_alerts").insert({ user_id: session.userId, role_category: role || null, province: province || null, practice_type: practice || null });
  if (error) {
    if (/up to 5/i.test(error.message)) return { error: "You can have up to 5 job alerts. Remove one to add another." };
    console.error("Alert create failed:", error.code, error.message);
    return { error: "We couldn't save that alert. Please try again." };
  }
  revalidatePath("/candidate/alerts");
  return { message: "Alert saved. We will email you when a new job matches." };
}

export async function deleteAlert(form: FormData) {
  await requireRole("candidate");
  const id = text(form, "id");
  const db = await supabaseServer();
  if (UUID.test(id) && db) await db.from("job_alerts").delete().eq("id", id);
  revalidatePath("/candidate/alerts");
}
