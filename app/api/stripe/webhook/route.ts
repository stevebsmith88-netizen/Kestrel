import { completeCardSetup } from "@/lib/job-payment-flow";
import { verifyStripeSignature } from "@/lib/stripe-webhook";

export const dynamic = "force-dynamic";

// Stripe calls this when something happens on our account (set up in Stripe, Developers, Webhooks, pointing at
// https://eyecarejobs.ca/api/stripe/webhook with the event checkout.session.completed). The one that matters today: a clinic has saved a
// card for a job. The clinic's own browser also comes back to the site and does the same work, so whichever arrives first wins and the
// other finds it done (lib/job-payment-flow.ts). That means a clinic who closes the tab after saving the card is not lost.
// Only messages signed with STRIPE_WEBHOOK_SECRET count. Nothing here charges a card.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Not set up", { status: 503 });
  const body = await request.text();
  if (!verifyStripeSignature(body, request.headers.get("stripe-signature"), secret)) return new Response("Unauthorized", { status: 401 });

  let event: { type?: string; data?: { object?: { id?: string; mode?: string } } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const object = event.data?.object;
  if (event.type === "checkout.session.completed" && object?.mode === "setup" && object.id) {
    const done = await completeCardSetup(object.id);
    // A logical problem (a card that was not saved, a session from another site) is logged and answered with success, so Stripe does not retry for days.
    if ("error" in done) console.error("Stripe webhook: card setup not completed:", done.error);
  }
  return Response.json({ received: true });
}
