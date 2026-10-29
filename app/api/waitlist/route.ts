import { NextResponse } from "next/server";
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

  const { error } = await db.from("waitlist").upsert(
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
  );

  if (error) {
    console.error("Waitlist insert failed:", error.message);
    return NextResponse.json({ error: "Something went wrong sending your details. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
