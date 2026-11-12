import { NextResponse } from "next/server";
import { cleanAttribution } from "@/lib/attribution";
import { emailLayout, sendEmail } from "@/lib/email";
import { unsubscribeIdUrl } from "@/lib/unsubscribe-link";
import { TURNSTILE_MESSAGE, passesTurnstile } from "@/lib/turnstile";
import { waitlistConfirmUrl } from "@/lib/waitlist-confirm";
import { supabaseAdmin } from "@/lib/supabase-server";
import { CONSENT_TEXT, validate } from "@/lib/waitlist";
import { joinAction } from "@/lib/waitlist-join";

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

  const { data: existing } = await db.from("waitlist").select("id, confirmed_at, confirmation_sent_at, unsubscribed_at").eq("email", values.email).maybeSingle();
  const action = joinAction(existing);

  // An address already on the list is never changed from this form (anyone can type anyone's address). Only a new
  // address is saved here. The answer is the same either way, so the form cannot be used to find out who is on the list.
  let id = existing?.id;
  if (action === "add") {
    const row = {
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
    };
    const save = (data: Record<string, unknown>) => db.from("waitlist").upsert(data, { onConflict: "email", ignoreDuplicates: true }).select("id");
    // Where the visit came from (migration 0032). If that migration has not been run on this database yet, the sign up
    // is still saved, just without the source, so a missing column can never stop someone joining.
    let { data: added, error } = await save({ ...row, ...cleanAttribution((body as Record<string, unknown>).attribution) });
    if (error && /utm_|referrer_host|landing_path/.test(error.message)) ({ data: added, error } = await save(row));
    if (error) {
      console.error("Waitlist insert failed:", error.message);
      return NextResponse.json({ error: "Something went wrong sending your details. Please try again." }, { status: 500 });
    }
    // Someone else added the same address a moment ago: treat it as already there.
    if (!added?.length) return NextResponse.json({ ok: true });
    id = added[0].id;
  }

  // A new address, or one not yet confirmed, is sent a link to confirm it. Nobody gets more than 1 an hour, so a
  // stranger cannot use this form to fill someone's inbox.
  if (id && (action === "add" || action === "send-confirmation")) {
    const unsubscribeUrl = unsubscribeIdUrl(id);
    const mail = emailLayout({
      heading: "Please confirm your email",
      paragraphs: [
        `Thanks, ${values.firstName}. Press the button below to confirm your email address and finish joining the Kestrel Eye Care Jobs waitlist.`,
        "If you did not ask to join, you can ignore this email and we will not add you.",
      ],
      buttonText: "Confirm my email",
      buttonUrl: waitlistConfirmUrl(id),
      unsubscribeUrl,
    });
    // The unsubscribe link is passed through, so an address on the do not email list is not sent this email (P1-23).
    const sent = await sendEmail({ to: values.email, subject: "Please confirm your email for the Kestrel waitlist", unsubscribeUrl, ...mail });
    if (sent) await db.from("waitlist").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", id);
  }
  return NextResponse.json({ ok: true });
}
