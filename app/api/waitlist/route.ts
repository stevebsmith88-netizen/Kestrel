import { NextResponse } from "next/server";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
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

  const db = supabaseAdmin();
  if (!db) {
    console.error("Waitlist: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set.");
    return NextResponse.json({ error: "The waitlist isn't connected yet. Please try again shortly." }, { status: 503 });
  }

  // Only people who are new get the welcome email, so signing up twice never sends two.
  const { data: existing } = await db.from("waitlist").select("id").eq("email", values.email).maybeSingle();

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

  if (error) {
    console.error("Waitlist insert failed:", error.message);
    return NextResponse.json({ error: "Something went wrong sending your details. Please try again." }, { status: 500 });
  }

  if (!existing && saved) {
    const unsubscribeUrl = `${SITE_URL}/unsubscribe/${saved.id}`;
    const mail = emailLayout({
      heading: "You're on the list",
      paragraphs: [
        `Thanks, ${values.firstName}. You are on the Kestrel Eye Care Jobs waitlist.`,
        "We are building a job board for eye care across Canada, with the pay shown on every job. We will email you the moment Kestrel opens.",
      ],
      buttonText: "Visit Kestrel",
      buttonUrl: SITE_URL,
      unsubscribeUrl,
    });
    await sendEmail({ to: values.email, subject: "You're on the Kestrel waitlist", unsubscribeUrl, ...mail });
  }
  return NextResponse.json({ ok: true });
}
