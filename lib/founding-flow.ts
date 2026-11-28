import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { foundingOfferOpen, foundingReminderEmail, foundingThanksEmail, foundingWelcomeEmail, reminderDue } from "@/lib/founding";
import { notify } from "@/lib/notifications";
import { foundingReminderMessage, foundingThanksMessage, foundingWelcomeMessage } from "@/lib/notify-text";
import { notifySlack } from "@/lib/notify-slack";
import { planByKey } from "@/lib/passes";
import { FOUNDING_CLINICS } from "@/lib/pricing";

// Founding clinics (step 5 of docs/plans/stripe-plan.md, migration 0052). Server only. Everything here is best effort: a problem, or a database that has
// not had migration 0052 yet, is logged and never stops a job from being approved or a pass from starting.

export async function foundingNumber(db: SupabaseClient, employerId: string): Promise<number | null> {
  try {
    const { data } = await db.from("founding_clinics").select("founding_number").eq("employer_id", employerId).maybeSingle();
    return (data?.founding_number as number | undefined) ?? null;
  } catch {
    return null;
  }
}

async function contact(db: SupabaseClient, employerId: string): Promise<{ email: string | null; ownerId: string | null; clinicName: string }> {
  const { data: employer } = await db.from("employers").select("clinic_name, owner_id, practice_type").eq("id", employerId).maybeSingle();
  const { data: c } = await db.from("employer_contacts").select("notify_email").eq("employer_id", employerId).maybeSingle();
  return { email: c?.notify_email || null, ownerId: (employer?.owner_id as string | null) ?? null, clinicName: employer?.clinic_name ?? "Your clinic" };
}

// Called when a clinic's job is approved. While the free launch lasts and places remain, the location takes the next place, and is welcomed. A clinic
// that is already founding is not welcomed twice.
export async function claimFoundingPlace(db: SupabaseClient, employerId: string): Promise<number | null> {
  try {
    if (!foundingOfferOpen()) return foundingNumber(db, employerId);
    const { data: employer } = await db.from("employers").select("practice_type").eq("id", employerId).maybeSingle();
    if (!employer || !["independent", "corporate"].includes(employer.practice_type as string)) return null;
    const { data, error } = await db.rpc("claim_founding_place", { emp: employerId, max_places: FOUNDING_CLINICS.places });
    if (error) {
      if (error.code !== "PGRST202" && error.code !== "42883") console.error("Founding place not claimed:", error.code, error.message);
      return null;
    }
    const number = typeof data === "number" ? data : null;
    if (!number) return null;
    const { data: row } = await db.from("founding_clinics").select("welcome_sent_at").eq("employer_id", employerId).maybeSingle();
    if (row && !row.welcome_sent_at) {
      const who = await contact(db, employerId);
      if (who.email) await sendEmail({ to: who.email, ...foundingWelcomeEmail({ clinicName: who.clinicName, number }) });
      await notify(db, who.ownerId, foundingWelcomeMessage({ number }));
      await db.from("founding_clinics").update({ welcome_sent_at: new Date().toISOString() }).eq("employer_id", employerId);
      await notifySlack("A new Founding clinic", [`Number ${number} of ${FOUNDING_CLINICS.places}: ${who.clinicName}`], { path: "/admin/payments", text: "Open the Founding clinics list" }, "jobs");
    }
    return number;
  } catch (e) {
    console.error("Founding place failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export type FoundingRow = { number: number; employerId: string; clinicName: string; city: string; province: string; claimedAt: string };

// The whole list for Admin, Payments.
export async function listFounding(db: SupabaseClient): Promise<FoundingRow[]> {
  try {
    const { data } = await db.from("founding_clinics").select("founding_number, employer_id, claimed_at, employers(clinic_name, city, province)").order("founding_number");
    return (data ?? []).map((r) => {
      const e = r.employers as unknown as { clinic_name: string; city: string; province: string } | null;
      return { number: r.founding_number as number, employerId: r.employer_id as string, clinicName: e?.clinic_name ?? "A clinic", city: e?.city ?? "", province: e?.province ?? "", claimedAt: r.claimed_at as string };
    });
  } catch {
    return [];
  }
}

// Email 2 (and an inbox message): thank you for starting a founding pass, with the lock date. Sent once.
export async function sendFoundingThanks(db: SupabaseClient, pass: { id: string; employer_id: string; plan: string; billing_interval: string; price_locked_until: string | null }): Promise<void> {
  const plan = planByKey(pass.plan);
  if (!plan) return;
  const who = await contact(db, pass.employer_id);
  const interval = pass.billing_interval === "year" ? "year" : "month";
  if (who.email) await sendEmail({ to: who.email, ...foundingThanksEmail({ planName: plan.name, interval, priceDollars: interval === "year" ? plan.yearly : plan.monthly, lockedUntil: pass.price_locked_until ? new Date(pass.price_locked_until) : null }) });
  await notify(db, who.ownerId, foundingThanksMessage({ planName: plan.name }));
  await db.from("location_passes").update({ thanks_sent_at: new Date().toISOString() }).eq("id", pass.id);
}

// Email 3 (and an inbox message): 30 days before a founding price lock ends, with the new price. This is also the notice. Called by the daily job; each
// pass is told once.
export async function sendFoundingReminders(db: SupabaseClient, now: Date = new Date()): Promise<number> {
  const soon = new Date(now.getTime() + (FOUNDING_CLINICS.noticeDays + 1) * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db.from("location_passes").select("id, employer_id, plan, price_locked_until").eq("founding", true).eq("status", "active").is("reminder_sent_at", null).not("price_locked_until", "is", null).lte("price_locked_until", soon);
  if (error) {
    if (error.code !== "42703" && error.code !== "42P01") console.error("Founding reminders not read:", error.code, error.message);
    return 0;
  }
  let sent = 0;
  for (const pass of data ?? []) {
    const end = new Date(pass.price_locked_until as string);
    const plan = planByKey(pass.plan as string);
    if (!plan || !reminderDue(end, now)) continue;
    const who = await contact(db, pass.employer_id as string);
    if (who.email) await sendEmail({ to: who.email, ...foundingReminderEmail({ planName: plan.name, lockEnd: end, newPriceDollars: plan.monthly }) });
    await notify(db, who.ownerId, foundingReminderMessage({ planName: plan.name }));
    await db.from("location_passes").update({ reminder_sent_at: new Date().toISOString() }).eq("id", pass.id);
    sent += 1;
  }
  return sent;
}
