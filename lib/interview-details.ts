// What a clinic tells a candidate when it invites them to interview (Steve, 19th November 2026): how (in person, online or by phone), when,
// for how long, and where. It travels as the last lines of the saved message, like the meeting link (lib/meeting-link.ts), so it needs no
// database change and works on every database. From it Kestrel builds a calendar file (.ics) that Apple Calendar, Google Calendar and
// Outlook on a phone or computer can all add in one tap, and 2 add to calendar links as a backup. Times are the clinic's own local time,
// worked out from the job's province. Kept free of app imports so it can be tested on its own (lib/interview-details.test.ts).
import { splitMeetingLink, MEETING_LINE } from "./meeting-link.ts";

export type InterviewFormat = "in_person" | "online" | "phone";
export const FORMAT_LABELS: Record<InterviewFormat, string> = { in_person: "In person", online: "Online (video call)", phone: "By phone" };
export const isFormat = (v: unknown): v is InterviewFormat => v === "in_person" || v === "online" || v === "phone";

export type Interview = { format: InterviewFormat; date?: string; time?: string; zone?: string; minutes?: number; place?: string };

// One time zone per province. A few provinces have 2 (parts of BC, Saskatchewan, Ontario, Quebec and Nunavut), so the clinic's time is
// shown on the invitation as written, with the zone named, and the candidate can see it before accepting.
const ZONES: Record<string, string> = {
  "British Columbia": "America/Vancouver", Alberta: "America/Edmonton", Saskatchewan: "America/Regina", Manitoba: "America/Winnipeg", Ontario: "America/Toronto",
  Quebec: "America/Toronto", "New Brunswick": "America/Moncton", "Nova Scotia": "America/Halifax", "Prince Edward Island": "America/Halifax",
  "Newfoundland and Labrador": "America/St_Johns", Yukon: "America/Whitehorse", "Northwest Territories": "America/Yellowknife", Nunavut: "America/Iqaluit",
};
export const zoneFor = (province: string | null | undefined) => ZONES[province ?? ""] ?? "America/Toronto";
const ZONE_NAMES = new Set(Object.values(ZONES));

export const LENGTHS = [15, 30, 45, 60, 90, 120];

const LINES = { format: "Interview format: ", time: "Interview time: ", place: "Interview place: " } as const;

function offsetMs(at: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(at);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second")) - at.getTime();
}

// The moment a local date and time in a zone falls, as a real instant.
export function localToUtc(date: string, time: string, zone: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t || !ZONE_NAMES.has(zone)) return null;
  const asIfUtc = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  const first = asIfUtc - offsetMs(new Date(asIfUtc), zone);
  const second = asIfUtc - offsetMs(new Date(first), zone);
  // A date that does not exist (the 31st of February) rolls over in the check, so it is refused.
  const check = new Date(asIfUtc);
  if (check.getUTCDate() !== Number(d[3]) || check.getUTCMonth() !== Number(d[2]) - 1 || Number(t[1]) > 23 || Number(t[2]) > 59) return null;
  return new Date(second);
}

type Raw = { format: unknown; date: unknown; time: unknown; minutes: unknown; place: unknown };

// A checked set of details, or the message for the clinic to read. The format is required. A date and time come together or not at all,
// and cannot be in the past. An in person interview needs its place.
export function cleanInterview(raw: Raw, province: string | null | undefined, now = new Date()): { interview: Interview; error?: undefined } | { interview?: undefined; error: string; field: string } {
  if (!isFormat(raw.format)) return { error: "Choose how the interview will happen: in person, online or by phone.", field: "format" };
  const date = typeof raw.date === "string" ? raw.date.trim() : "";
  const time = typeof raw.time === "string" ? raw.time.trim() : "";
  const place = typeof raw.place === "string" ? raw.place.replace(/\s+/g, " ").trim().slice(0, 200) : "";
  const out: Interview = { format: raw.format };
  if (date || time) {
    if (!date || !time) return { error: "Give both the date and the time, or leave both empty.", field: "date" };
    const zone = zoneFor(province);
    const start = localToUtc(date, time, zone);
    if (!start) return { error: "That date or time did not look right. Please check it.", field: "date" };
    if (start.getTime() < now.getTime()) return { error: "That time has already passed. Choose a date and time in the future.", field: "date" };
    const minutes = Number(raw.minutes);
    out.date = date;
    out.time = time;
    out.zone = zone;
    out.minutes = LENGTHS.includes(minutes) ? minutes : 30;
  }
  if (raw.format === "in_person") {
    if (!place) return { error: "Add the address or place for an in person interview.", field: "place" };
    out.place = place;
  }
  return { interview: out };
}

// The lines added to the end of the clinic's message, then the meeting link line if there is one.
export function withInterview(message: string, interview: Interview, link: string): string {
  const lines = [`${LINES.format}${FORMAT_LABELS[interview.format]}`];
  if (interview.date && interview.time && interview.zone) lines.push(`${LINES.time}${interview.date} ${interview.time} ${interview.zone} ${interview.minutes ?? 30}`);
  if (interview.place) lines.push(`${LINES.place}${interview.place}`);
  if (link) lines.push(`${MEETING_LINE}${link}`);
  return `${message.trimEnd()}\n\n${lines.join("\n")}`;
}

const FORMAT_BY_LABEL = new Map(Object.entries(FORMAT_LABELS).map(([k, v]) => [v, k as InterviewFormat]));

// Splits a saved message into the clinic's words, the interview details and the meeting link. Anything that does not check out stays text.
export function splitInterview(message: string | null | undefined): { text: string; interview: Interview | null; link: string | null } {
  const { text: afterLink, link } = splitMeetingLink(message);
  const lines = afterLink.split("\n");
  let start = lines.length;
  let interview: Interview | null = null;
  const found: Interview = { format: "in_person" };
  let sawFormat = false;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    const place = line.startsWith(LINES.place) ? line.slice(LINES.place.length).trim() : null;
    const when = line.startsWith(LINES.time) ? /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) (\S+) (\d{1,3})$/.exec(line.slice(LINES.time.length).trim()) : null;
    const format = line.startsWith(LINES.format) ? FORMAT_BY_LABEL.get(line.slice(LINES.format.length).trim() as never) : undefined;
    if (place) { found.place = place.slice(0, 200); start = i; }
    else if (when && localToUtc(when[1], when[2], when[3])) { found.date = when[1]; found.time = when[2]; found.zone = when[3]; found.minutes = Number(when[4]); start = i; }
    else if (format) { found.format = format; sawFormat = true; start = i; break; }
    else break;
  }
  if (sawFormat) interview = found;
  else return { text: afterLink, interview: null, link };
  return { text: lines.slice(0, start).join("\n").trim(), interview, link };
}

// How the time reads to a person, in the clinic's own zone: "Tuesday 24th November 2026 at 2:00 pm (Eastern time)".
export function whenText(i: Interview): string {
  if (!i.date || !i.time || !i.zone) return "";
  const at = localToUtc(i.date, i.time, i.zone);
  if (!at) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: i.zone, weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "long" }).formatToParts(at);
  const p = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  const day = Number(p("day"));
  const ord = day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ?? "th";
  const zone = p("timeZoneName").replace(/ (Standard|Daylight) Time$/, " time");
  return `${p("weekday")} ${day}${ord} ${p("month")} ${p("year")} at ${p("hour")}:${p("minute")} ${p("dayPeriod").toLowerCase().replace(/\./g, "")} (${zone})`;
}

export function detailsLines(i: Interview, link: string | null): string[] {
  const out = [`How: ${FORMAT_LABELS[i.format]}`];
  const when = whenText(i);
  if (when) out.push(`When: ${when}${i.minutes ? `, about ${i.minutes} minutes` : ""}`);
  if (i.place) out.push(`Where: ${i.place}`);
  if (i.format === "phone") out.push("The clinic will call you on the number in your application.");
  if (link) out.push("Join: use the Join the meeting button.");
  return out;
}

// ---- Calendar file and links ----

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Lines are cut at 75 bytes and continued with a space, as the calendar format asks.
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export type CalendarEvent = { id: string; jobTitle: string; clinicName: string; interview: Interview; link: string | null };

function eventFacts(e: CalendarEvent) {
  const i = e.interview;
  const start = i.date && i.time && i.zone ? localToUtc(i.date, i.time, i.zone) : null;
  if (!start) return null;
  const end = new Date(start.getTime() + (i.minutes ?? 30) * 60_000);
  const location = i.format === "in_person" ? i.place ?? "" : i.format === "online" ? e.link ?? "Online" : "Phone call";
  const description = [`Interview for ${e.jobTitle} with ${e.clinicName}.`, `${FORMAT_LABELS[i.format]}.`, e.link ? `Join: ${e.link}` : "", i.format === "phone" ? "The clinic will call you." : ""].filter(Boolean).join("\n");
  return { start, end, location, description, summary: `Interview: ${e.jobTitle} at ${e.clinicName}` };
}

export function buildIcs(e: CalendarEvent, now = new Date()): string | null {
  const f = eventFacts(e);
  if (!f) return null;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kestrel Eye Care Jobs//Interview//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:interview-${e.id}@eyecarejobs.ca`, `DTSTAMP:${icsDate(now)}`, `DTSTART:${icsDate(f.start)}`, `DTEND:${icsDate(f.end)}`,
    `SUMMARY:${icsText(f.summary)}`, `LOCATION:${icsText(f.location)}`, `DESCRIPTION:${icsText(f.description)}`,
    ...(e.link ? [`URL:${e.link}`] : []),
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Interview reminder", "TRIGGER:-PT1H", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

// Backup links for people whose email program does not offer the attachment.
export function calendarLinks(e: CalendarEvent): { google: string; outlook: string } | null {
  const f = eventFacts(e);
  if (!f) return null;
  const google = `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: f.summary, dates: `${icsDate(f.start)}/${icsDate(f.end)}`, details: f.description, location: f.location }).toString()}`;
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?${new URLSearchParams({ path: "/calendar/action/compose", rru: "addevent", subject: f.summary, startdt: f.start.toISOString(), enddt: f.end.toISOString(), body: f.description, location: f.location }).toString()}`;
  return { google, outlook };
}

