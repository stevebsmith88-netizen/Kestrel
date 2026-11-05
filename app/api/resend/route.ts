import { actionFor, webhookIsGenuine } from "@/lib/resend-webhook";
import { suppress } from "@/lib/suppression";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Resend calls this when an email bounces for good or someone marks it as spam (set up in Resend, Webhooks, with
// the events email.bounced and email.complained, pointing at https://eyecarejobs.ca/api/resend). The address goes on
// the do not email list, and any outreach sequence to it stops. Only messages signed with RESEND_WEBHOOK_SECRET count.
export async function POST(request: Request) {
  const body = await request.text();
  const genuine = webhookIsGenuine(process.env.RESEND_WEBHOOK_SECRET, {
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
  }, body);
  if (!genuine) return new Response("Unauthorized", { status: 401 });

  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const action = actionFor(event);
  if (!action) return Response.json({ ok: true, ignored: true });

  const admin = supabaseAdmin();
  for (const address of action.addresses) {
    // If this fails, answer with an error so Resend tries again later.
    if (!(await suppress(address, action.reason, "Resend webhook"))) return new Response("Could not save", { status: 500 });
    if (admin) {
      await admin
        .from("outreach_contacts")
        .update({ status: "stopped", stop_reason: action.reason === "bounced" ? "bounced" : "unsubscribed", next_due_at: null, updated_at: new Date().toISOString() })
        .eq("email", address)
        .eq("status", "active");
    }
  }
  return Response.json({ ok: true });
}
