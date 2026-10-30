import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// One cell of the spreadsheet. A leading = + - or @ would be run as a formula by
// Excel, so it is neutralised.
function cell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return new Response("Not found", { status: 404 });
  const db = supabaseAdmin();
  if (!db) return new Response("Not available", { status: 503 });

  const { data, error } = await db
    .from("waitlist")
    .select("created_at, audience, first_name, last_name, email, clinic_name, role, province, consent_at, unsubscribed_at, consent_text")
    .order("created_at", { ascending: false });
  if (error) return new Response("Could not load the waitlist", { status: 500 });

  const columns = ["created_at", "audience", "first_name", "last_name", "email", "clinic_name", "role", "province", "consent_at", "unsubscribed_at", "consent_text"] as const;
  const lines = [columns.join(","), ...(data ?? []).map((row) => columns.map((c) => cell(row[c])).join(","))];
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kestrel-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
