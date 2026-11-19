import { getSession } from "@/lib/auth";
import { insightsRows } from "@/lib/insights";
import { loadInsights } from "@/lib/insights-data";

export const dynamic = "force-dynamic";

const cell = (value: string) => {
  // A leading = + - or @ can be run as a formula when the file is opened in a spreadsheet.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// The Insights figures as a spreadsheet. Admin only, totals only, small counts hidden.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return new Response("Not found", { status: 404 });
  const insights = await loadInsights();
  if (!insights) return new Response("Not available", { status: 503 });
  const body = insightsRows(insights).map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kestrel-insights-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
