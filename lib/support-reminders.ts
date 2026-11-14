// A reminder when a support request or a reported job has waited more than 1 business day (next tasks item 19b). Kestrel promises to look at a
// reported job within 2 business days (/fake-jobs), so the reminder comes first. Kept free of the database so it can be tested.

// Whole business days (Monday to Friday) after the day `from` falls on, up to and including the day `now` falls on, by Toronto time.
export function businessDaysSince(from: Date, now: Date): number {
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const start = new Date(`${day(from)}T12:00:00Z`);
  const end = new Date(`${day(now)}T12:00:00Z`);
  let n = 0;
  for (let t = start.getTime() + 86400000; t <= end.getTime(); t += 86400000) {
    const weekday = new Date(t).getUTCDay();
    if (weekday !== 0 && weekday !== 6) n += 1;
  }
  return n;
}

export const overdue = (createdAt: string, now: Date, after = 1) => businessDaysSince(new Date(createdAt), now) >= after;

// The words for the reminder, or nothing when nothing has waited.
export function reminderLines(supportWaiting: number, reportsWaiting: number): string[] {
  const lines: string[] = [];
  if (supportWaiting > 0) lines.push(`${supportWaiting} ${supportWaiting === 1 ? "support request has" : "support requests have"} waited more than 1 business day`);
  if (reportsWaiting > 0) lines.push(`${reportsWaiting} ${reportsWaiting === 1 ? "reported job has" : "reported jobs have"} waited more than 1 business day (we promise to look within 2)`);
  return lines;
}
