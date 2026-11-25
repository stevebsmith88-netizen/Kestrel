import { requireRole } from "@/lib/auth";
import { getApplication } from "@/lib/candidate";
import { buildIcs, splitInterview } from "@/lib/interview-details";

// The interview as a calendar file (.ics) for the signed in candidate who was invited. Apple Calendar, Google Calendar and Outlook on a
// phone or computer open it and offer to add it. Only the candidate's own application is found (getApplication reads as them).
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("candidate");
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const found = await getApplication(id);
  if (!found || found.application.status !== "interview") return new Response("Not found", { status: 404 });
  const a = found.application;
  const { interview, link } = splitInterview(a.clinic_message);
  const ics = interview ? buildIcs({ id: a.id, jobTitle: a.job_title, clinicName: a.clinic_name ?? "the clinic", interview, link }) : null;
  if (!ics) return new Response("Not found", { status: 404 });
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="interview.ics"', "Cache-Control": "private, no-store" } });
}
