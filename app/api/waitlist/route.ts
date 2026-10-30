import { NextResponse } from "next/server";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import { TURNSTILE_MESSAGE, passesTurnstile } from "@/lib/turnstile";
import { waitlistConfirmUrl } from "@/lib/waitlist-confirm";
import { supabaseAdmin } from "@/lib/supabase-server";
import { CONSENT_TEXT, validate } from "@/lib/waitlist";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong sending your details. Please try again." }, { status: 400 });
  }

  const { values, errors, ok } = validate((body ?? {}) as Record<string, unknown>);

  // Bots fill the hidden "website" field. Pretend it worked and save nothing.
  if (values.website) return NextResponse.json({ ok: true });
  if (!ok) return NextResponse.json({ errors }, { status: 422 });
  if (!(await passesTurnstile((body as Record<string, unknown> | null)?.turnstileToken))) return NextResponse.json({ error: TURNSTILE_MESSAGE }, { status: 400 });

  const db = supabaseAdmin();
  if (!db) {
    console.error("Waitlist: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.");
    return NextResponse.json({ error: "The waitlist isn't connected yet. Please try again shortly." }, { status: 503 });
  }

  const { data: existing } = await db.from("waitlist").select("id, confirmed_at, confirmation_sent_at").eq("email", values.email).maybeSingle();

  const { data: saved, error } = await db.from("waitlist").upsert(
    {
      audience: values.audience,
      first_name: values.firstName,
      last_name: values.lastName || null,
      email: values.email,
      clinic_name: values.audience === "clinic" ? values.clinicName : null,
      role: values.role || null,
      province: values.province,
      consent: true,
      consent_text: CONSENT_TEXT,
      consent_at: new Date().toISOString(),
      unsubscribed_at: null,
    },
    { onConflict: "email" },
  ).select("id").single();

  if (error || !saved) {
    console.error("Waitlist insert failed:", error?.message);
    return NextResponse.json({ error: "Something went wrong sending your details. Please try again." }, { status: 500 });
  }

  // A new address, or one not yet confirmed, is sent a link to confirm it. Nobody gets more than 1 an hour, so a
  // stranger cannot use this form to fill someone's inbox. People who have already confirmed are not emailed again.
  // The answer is the same either way, so the form cannot be used to find out who is on the list.
  const recentlySent = existing?.confirmation_sent_at && Date.now() - new Date(existing.confirmation_sent_at).getTime() < 60 * 60 * 1000;
  if (!existing?.confirmed_at && !recentlySent) {
    const mail = emailLayout({
      heading: "Please confirm your email",
      paragraphs: [
        `Thanks, ${values.firstName}. Press the button below to confirm your email address and finish joining the Kestrel Eye Care Jobs waitlist.`,
        "If you did not ask to join, you can ignore this email and we will not add you.",
      ],
      buttonText: "Confirm my email",
      buttonUrl: waitlistConfirmUrl(saved.id),
      unsubscribeUrl: `${SITE_URL}/unsubscribe/${saved.id}`,
    });
    // No unsubscribe address check here: this answers a request the person has just made.
    const sent = await sendEmail({ to: values.email, subject: "Please confirm your email for the Kestrel waitlist", ...mail });
    if (sent) await db.from("waitlist").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", saved.id);
  }
  return NextResponse.json({ ok: true });
}
