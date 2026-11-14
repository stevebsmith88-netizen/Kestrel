"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { getMyEmployer } from "@/lib/clinic";
import { emailLayout, sendEmail, SITE_URL } from "@/lib/email";
import type { JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { ACCESS_DAYS, ACCESS_TEXT, accessEnds, FEEDBACK_KINDS, HELP_REASONS, kindLabel, reasonLabel, REQUESTS_PER_DAY, SUPPORT_EMAIL } from "@/lib/support";

// Help requests and feedback (Steve, 14th November 2026; migration 0046). Each is saved and emailed to Kestrel's support address, with the
// person's email as the reply address so answering is 1 click.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const textOf = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
const pageOf = (form: FormData) => {
  const page = textOf(form, "page", 200);
  return page.startsWith("/") ? page : null;
};

async function underDailyLimit(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, userId: string) {
  const { count } = await admin.from("support_requests").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  return (count ?? 0) < REQUESTS_PER_DAY;
}

export async function requestHelp(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("clinic");
  const admin = supabaseAdmin();
  if (!admin) return { error: NOT_CONNECTED };
  const employer = await getMyEmployer(session.userId);
  const reason = String(form.get("reason") ?? "");
  const message = textOf(form, "message", 2000);
  const allow = form.get("allow") === "yes";
  if (!HELP_REASONS.some((r) => r.value === reason)) return { errors: { reason: "Choose what it is about." }, error: "Choose what it is about." };
  if (message.length < 5) return { errors: { message: "Tell us briefly what is happening." }, error: "Tell us briefly what is happening." };
  // Only the owner can let Kestrel into the clinic's account. A team member can still ask, and Kestrel answers by email.
  if (allow && employer?.level !== "owner") return { error: "Only the clinic owner can let Kestrel into the account. Untick the box, or ask the owner to send this." };
  if (!(await underDailyLimit(admin, session.userId))) return { error: "You have sent several requests today. We will reply to those first." };
  const until = allow && employer ? accessEnds(new Date()).toISOString() : null;
  const { data, error } = await admin.from("support_requests").insert({
    user_id: session.userId, employer_id: employer?.id ?? null, kind: "help", reason, message, page: pageOf(form),
    access_until: until, access_text: until ? ACCESS_TEXT : null,
  }).select("id").single();
  if (error || !data) {
    console.error("Help request not saved:", error?.code, error?.message);
    return { error: `We couldn't send that just now. Please email ${SUPPORT_EMAIL} instead.` };
  }
  await sendEmail({
    to: SUPPORT_EMAIL, replyTo: session.email, subject: `Help request: ${employer?.clinic_name ?? "a clinic"} (${reasonLabel(reason)})`,
    ...emailLayout({
      heading: "A clinic asked for help",
      paragraphs: [
        `${session.fullName || session.email} (${session.email}) at ${employer?.clinic_name ?? "a clinic with no profile yet"} asked about: ${reasonLabel(reason)}.`,
        message,
        until ? `They let Kestrel into the clinic's account until the request is closed or for ${ACCESS_DAYS} days.` : "They did not give access to the account. Reply by email.",
        "Reply to this email to answer them.",
      ],
      buttonText: "Open help requests",
      buttonUrl: `${SITE_URL}/admin/requests`,
    }),
  });
  revalidatePath("/account/help");
  return { message: until ? "Sent. We usually reply within 1 business day, and we can now look at your clinic's account to help. You can take that back below." : "Sent. We usually reply within 1 business day, by email." };
}

export async function sendFeedback(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate", "clinic");
  const admin = supabaseAdmin();
  if (!admin) return { error: NOT_CONNECTED };
  const kind = String(form.get("kind") ?? "");
  const message = textOf(form, "message", 2000);
  if (!FEEDBACK_KINDS.some((k) => k.value === kind)) return { errors: { kind: "Choose what it is." }, error: "Choose what it is." };
  if (message.length < 5) return { errors: { message: "Tell us a little more." }, error: "Tell us a little more." };
  if (!(await underDailyLimit(admin, session.userId))) return { error: "You have sent several messages today. Thank you, we will read those first." };
  const employer = session.role === "clinic" ? await getMyEmployer(session.userId) : null;
  const { error } = await admin.from("support_requests").insert({ user_id: session.userId, employer_id: employer?.id ?? null, kind, message, page: pageOf(form) });
  if (error) {
    console.error("Feedback not saved:", error.code, error.message);
    return { error: `We couldn't send that just now. Please email ${SUPPORT_EMAIL} instead.` };
  }
  await sendEmail({
    to: SUPPORT_EMAIL, replyTo: session.email, subject: `Feedback: ${kindLabel(kind)}`,
    ...emailLayout({ heading: kindLabel(kind), paragraphs: [`From ${session.fullName || session.email} (${session.email}, ${session.role}).`, message], buttonText: "Open feedback", buttonUrl: `${SITE_URL}/admin/requests` }),
  });
  return { message: "Thank you. Every message is read by a person, and we reply if you asked a question." };
}

// The clinic owner takes back Kestrel's access before the 7 days are up.
export async function endHelpAccess(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("clinic");
  const admin = supabaseAdmin();
  const id = String(form.get("id") ?? "");
  const employer = await getMyEmployer(session.userId);
  if (!admin || !UUID.test(id) || employer?.level !== "owner") return { error: "That didn't work. Please refresh and try again." };
  await admin.from("support_requests").update({ access_until: new Date().toISOString() }).eq("id", id).eq("employer_id", employer.id);
  revalidatePath("/account/help");
  return { message: "Done. Kestrel can no longer see or change your clinic's account." };
}

// Admin: marks a request or a piece of feedback done. For a help request this also ends Kestrel's access to the clinic's account.
export async function closeSupportRequest(form: FormData) {
  const session = await requireRole("admin");
  const admin = supabaseAdmin();
  const id = String(form.get("id") ?? "");
  if (admin && UUID.test(id)) await admin.from("support_requests").update({ status: "done", closed_at: new Date().toISOString(), closed_by: session.userId }).eq("id", id);
  revalidatePath("/admin/requests");
}
