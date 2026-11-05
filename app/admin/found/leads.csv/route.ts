import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// One cell of the spreadsheet. A leading = + - or @ would be run as a formula by Excel, so it is neutralised.
function cell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// The clinic leads as a spreadsheet, with where and when each contact email was found. Admin only.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return new Response("Not found", { status: 404 });
  const db = supabaseAdmin();
  if (!db) return new Response("Not available", { status: 503 });
  const { data, error } = await db.from("clinic_leads").select("*").order("found_at", { ascending: false });
  if (error) return new Response("Could not load the leads", { status: 500 });
  const columns = ["clinic_name", "province", "city", "practice_type", "website", "careers_url", "job_title", "role_category", "posted_text", "pay_as_written", "source_kind", "source_url", "contact_email", "email_source_url", "email_found_at", "status", "note", "found_at"] as const;
  const lines = [columns.join(","), ...(data ?? []).map((row) => columns.map((c) => cell((row as Record<string, unknown>)[c])).join(","))];
  return new Response(lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="kestrel-clinic-leads.csv"', "Cache-Control": "no-store" },
  });
}
