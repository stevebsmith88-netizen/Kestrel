// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIcs, calendarLinks, cleanInterview, localToUtc, splitInterview, whenText, withInterview, zoneFor } from "./interview-details.ts";

const now = new Date("2026-11-19T12:00:00Z");

test("a clinic's local time becomes the right instant, in winter and summer", () => {
  assert.equal(localToUtc("2026-11-24", "14:00", "America/Toronto")?.toISOString(), "2026-11-24T19:00:00.000Z");
  assert.equal(localToUtc("2027-07-06", "14:00", "America/Toronto")?.toISOString(), "2027-07-06T18:00:00.000Z");
  assert.equal(localToUtc("2026-11-24", "09:30", "America/Halifax")?.toISOString(), "2026-11-24T13:30:00.000Z");
  assert.equal(localToUtc("2026-02-31", "09:30", "America/Halifax"), null);
  assert.equal(localToUtc("2026-11-24", "25:00", "America/Toronto"), null);
  assert.equal(zoneFor("Alberta"), "America/Edmonton");
});

test("the form answers are checked", () => {
  assert.ok(cleanInterview({ format: "", date: "", time: "", minutes: "", place: "" }, "Ontario", now).error);
  assert.ok(cleanInterview({ format: "online", date: "2026-11-24", time: "", minutes: "", place: "" }, "Ontario", now).error);
  assert.ok(cleanInterview({ format: "online", date: "2026-11-01", time: "10:00", minutes: "30", place: "" }, "Ontario", now).error);
  assert.ok(cleanInterview({ format: "in_person", date: "2026-11-24", time: "10:00", minutes: "30", place: "" }, "Ontario", now).error);
  const ok = cleanInterview({ format: "in_person", date: "2026-11-24", time: "10:00", minutes: "45", place: " 12 Main St " }, "Ontario", now);
  assert.deepEqual(ok.interview, { format: "in_person", date: "2026-11-24", time: "10:00", zone: "America/Toronto", minutes: 45, place: "12 Main St" });
  assert.deepEqual(cleanInterview({ format: "phone", date: "", time: "", minutes: "", place: "" }, "Ontario", now).interview, { format: "phone" });
});

test("the details ride at the end of the message and split back out", () => {
  const i = { format: "online" as const, date: "2026-11-24", time: "14:00", zone: "America/Toronto", minutes: 45 };
  const saved = withInterview("See you then.", i, "https://zoom.us/j/123456789");
  assert.equal(saved, "See you then.\n\nInterview format: Online (video call)\nInterview time: 2026-11-24 14:00 America/Toronto 45\nJoin the meeting: https://zoom.us/j/123456789");
  assert.deepEqual(splitInterview(saved), { text: "See you then.", interview: i, link: "https://zoom.us/j/123456789" });
  const inPerson = { format: "in_person" as const, place: "12 Main St" };
  assert.deepEqual(splitInterview(withInterview("Hello.", inPerson, "")), { text: "Hello.", interview: inPerson, link: null });
});

test("a message with no details, or a faked time, stays plain text", () => {
  assert.deepEqual(splitInterview("Just words."), { text: "Just words.", interview: null, link: null });
  assert.deepEqual(splitInterview("Hi.\n\nJoin the meeting: https://zoom.us/j/123456789"), { text: "Hi.", interview: null, link: "https://zoom.us/j/123456789" });
  const fake = "Hi.\n\nInterview time: 2026-02-31 14:00 America/Toronto 45";
  assert.equal(splitInterview(fake).interview, null);
});

test("the time reads plainly in the clinic's zone", () => {
  assert.equal(whenText({ format: "online", date: "2026-11-24", time: "14:00", zone: "America/Toronto", minutes: 45 }), "Tuesday 24th November 2026 at 2:00 pm (Eastern time)");
  assert.equal(whenText({ format: "phone" }), "");
});

test("the calendar file has the right times, folds long lines and carries the link", () => {
  const event = { id: "abc", jobTitle: "Optician", clinicName: "Brightview, North", interview: { format: "online" as const, date: "2026-11-24", time: "14:00", zone: "America/Toronto", minutes: 45 }, link: "https://zoom.us/j/123456789?pwd=" + "x".repeat(80) };
  const ics = buildIcs(event, now) ?? "";
  assert.match(ics, /DTSTART:20261124T190000Z/);
  assert.match(ics, /DTEND:20261124T194500Z/);
  assert.match(ics, /SUMMARY:Interview: Optician at Brightview\\, North/);
  assert.ok(ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 76));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  const links = calendarLinks(event);
  assert.match(links?.google ?? "", /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  assert.match(links?.outlook ?? "", /^https:\/\/outlook\.live\.com\/calendar\//);
  assert.equal(buildIcs({ ...event, interview: { format: "phone" } }, now), null);
});
