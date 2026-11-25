import { unsubscribeByAddress, unsubscribeById } from "@/lib/unsubscribe-core";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

// The one click unsubscribe (RFC 8058, audit P1-51). Mail programs such as Gmail send a POST here when someone presses their own
// Unsubscribe button, and it takes effect at once. The link is signed, exactly as the one in the email footer. It keeps working
// while the maintenance switch is on, because a request to stop email must always be honoured.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const s = url.searchParams.get("s") ?? "";
  const done = id ? await unsubscribeById(id, s) : await unsubscribeByAddress(url.searchParams.get("e") ?? "", s);
  return new Response(done ? "Unsubscribed." : "That link doesn't look right.", { status: done ? 200 : 400, headers });
}

// Opening the address in a browser changes nothing: it shows the usual page with its button.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const s = url.searchParams.get("s") ?? "";
  const page = id ? `/unsubscribe/${encodeURIComponent(id)}?s=${encodeURIComponent(s)}` : `/unsubscribe/address?e=${encodeURIComponent(url.searchParams.get("e") ?? "")}&s=${encodeURIComponent(s)}`;
  return Response.redirect(new URL(page, url.origin), 303);
}
