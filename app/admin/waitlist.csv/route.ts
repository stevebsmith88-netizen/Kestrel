import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { unsubscribeIdUrl } from "@/lib/unsubscribe-link";
import { waitlistStatus } from "@/lib/waitlist-join";

export const dynamic = "force-dynamic";

// One cell of the spreadsheet. A leading = + - or @ would be run as a formula by
// Excel, so it is neutralised.
function cell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// By default this is the "ready to email" list: people who confirmed their address, have not unsubscribed and are not on the
// do not email list, each with their own unsubscribe link to put in the email. Add ?all=1 for everyone, with a status column.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return new Response("Not found", { status: 404 });
  const db = supabaseAdmin();
  if (!db) return new Response("Not available", { status: 503 });
  const everyone = new URL(request.url).searchParams.get("all") === "1";

  const { data, error } = await db
    .from("waitlist")
    .select("id, created_at, audience, first_name, last_name, email, clinic_name, role, province, consent_at, confirmed_at, unsubscribed_at, consent_text")
    .order("created_at", { ascending: false });
  if (error) return new Response("Could not load the waitlist", { status: 500 });
  const { data: blockedRows, error: blockedError } = await db.from("email_suppressions").select("address");
  if (blockedError) return new Response("Could not check the do not email list", { status: 500 });
  const blocked = new Set((blockedRows ?? []).map((r) => r.address));

  const rows = (data ?? []).map((row) => ({ ...row, status: waitlistStatus(row, blocked), unsubscribe_link: unsubscribeIdUrl(row.id) }));
  const kept = everyone ? rows : rows.filter((r) => r.status === "ready");
  const columns = ["created_at", "audience", "first_name", "last_name", "email", "clinic_name", "role", "province", "consent_at", "confirmed_at", "unsubscribed_at", "status", "unsubscribe_link", "consent_text"] as const;
  const lines = [columns.join(","), ...kept.map((row) => columns.map((c) => cell(row[c])).join(","))];
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kestrel-waitlist-${everyone ? "everyone" : "ready-to-email"}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
