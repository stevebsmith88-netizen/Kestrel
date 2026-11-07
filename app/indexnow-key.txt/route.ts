import { indexNowKey } from "@/lib/indexnow";
import { validKey } from "@/lib/indexnow-rules";

// The key file IndexNow checks (https://eyecarejobs.ca/indexnow-key.txt). It holds only the key, which is public by design.
export const dynamic = "force-dynamic";

export function GET() {
  const key = indexNowKey();
  if (!validKey(key)) return new Response("Not found", { status: 404 });
  return new Response(key, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
