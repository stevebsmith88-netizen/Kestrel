// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { applicationUpdateEmail, interviewCalendarFile, plainAddresses, updateSubject, writtenBy } from "./clinic-message.ts";
import { withInterview } from "./interview-details.ts";
import { applicationMoved } from "./notify-text.ts";

// P1-47: a clinic's own words are emailed from Kestrel's address. Web addresses in them are shown as plain text that email
// programs do not turn into links, and the email and inbox message say who wrote it.

const ZW = "​";
const linkish = /https?:\/\/[a-z0-9.-]+\.[a-z]{2,}|www\.[a-z0-9-]+\.[a-z]{2,}|\b[a-z0-9-]+\.(?:ca|com)\b/i;

test("the line naming the writer reads exactly as agreed", () => {
  assert.equal(writtenBy("Brightview Optometry"), "This message was written by Brightview Optometry.");
});

test("web addresses lose the shape email programs turn into links, and read the same", () => {
  for (const address of ["https://evil.example.com/login?x=1", "http://clinic.ca", "www.clinic.ca/book", "clinic.ca", "Book.Clinic.COM/now"]) {
    const out = plainAddresses(`Please visit ${address} today.`);
    assert.doesNotMatch(out, linkish, address);
    assert.equal(out.replaceAll(ZW, ""), `Please visit ${address} today.`, `${address} reads the same once the hidden spaces are taken out`);
  }
});

test("ordinary sentences, times, money and email addresses are left alone", () => {
  for (const text of ["We loved meeting you. Thanks again!", "Your interview is at 10.30 on Monday.", "Pay is $85,000.00 a year.", "Write to jane@clinic.ca with questions."]) {
    assert.equal(plainAddresses(text), text);
  }
});

test("the email has the message as plain text, the writer line, and the only link is Kestrel's own button", () => {
  const mail = applicationUpdateEmail({ jobTitle: "Optician", clinicName: "Brightview", label: "Interview", message: "Book at https://evil.example.com/login now.", applicationId: "a1", site: "https://eyecarejobs.ca" });
  assert.match(mail.text, /This message was written by Brightview\./);
  assert.match(mail.html, /This message was written by Brightview\./);
  assert.doesNotMatch(mail.html + mail.text, /https?:\/\/evil\.example\.com/);
  const hrefs = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(hrefs.every((h) => h.startsWith("https://eyecarejobs.ca/")), hrefs.join(", "));
});

test("an interview email opens warmly and carries a meeting link as the only outside link", () => {
  const mail = applicationUpdateEmail({ jobTitle: "Optician", clinicName: "Brightview", label: "Interview", message: "See you Monday at 2 pm.\n\nJoin the meeting: https://zoom.us/j/123456789?pwd=abc", applicationId: "a1", site: "https://eyecarejobs.ca", status: "interview" });
  assert.match(mail.html, /Good news, you have been invited to interview/);
  assert.match(mail.text, /Join the meeting: https:\/\/zoom\.us\/j\/123456789\?pwd=abc/);
  assert.match(mail.text, /See you Monday at 2 pm\./);
  const outside = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((h) => !h.startsWith("https://eyecarejobs.ca/"));
  assert.deepEqual(outside, ["https://zoom.us/j/123456789?pwd=abc"]);
});

test("an interview with a date and time attaches a calendar file and offers calendar links", () => {
  const message = withInterview("See you then.", { format: "in_person", date: "2026-11-24", time: "14:00", zone: "America/Toronto", minutes: 45, place: "12 Main St" }, "");
  const file = interviewCalendarFile({ jobTitle: "Optician", clinicName: "Brightview", message, applicationId: "a1" });
  assert.equal(file?.filename, "interview.ics");
  assert.match(Buffer.from(file?.content ?? "", "base64").toString(), /DTSTART:20261124T190000Z/);
  const mail = applicationUpdateEmail({ jobTitle: "Optician", clinicName: "Brightview", label: "Interview", message, applicationId: "a1", site: "https://eyecarejobs.ca", status: "interview" });
  assert.match(mail.text, /How: In person/);
  assert.match(mail.text, /Where: 12 Main St/);
  assert.match(mail.text, /Add to Google Calendar/);
  assert.equal(interviewCalendarFile({ jobTitle: "Optician", clinicName: "Brightview", message: withInterview("Hi.", { format: "phone" }, ""), applicationId: "a1" }), null);
});

test("each step opens differently, and only good news says so", () => {
  const heads = ["interview", "offer", "hired", "not_selected", "role_filled", "kept"].map((status) => applicationUpdateEmail({ jobTitle: "Optician", clinicName: "Brightview", label: "x", message: "", applicationId: "a1", site: "https://eyecarejobs.ca", status }).html.match(/line-height:32px;color:#1B2B4B;">([^<]+)</)?.[1]);
  assert.equal(new Set(heads).size, heads.length);
  for (const sad of heads.slice(3)) assert.doesNotMatch(String(sad), /good news|congratulations/i);
  assert.doesNotMatch(updateSubject("not_selected", "Optician", "Brightview"), /good news|congratulations/i);
});

test("a look alike meeting link in a message is not turned into a link", () => {
  const mail = applicationUpdateEmail({ jobTitle: "Optician", clinicName: "Brightview", label: "Interview", message: "Hi.\n\nJoin the meeting: https://evil.example.com/login", applicationId: "a1", site: "https://eyecarejobs.ca", status: "interview" });
  assert.doesNotMatch(mail.html + mail.text, /https?:\/\/evil\.example\.com/);
});

test("an update with no message has no writer line", () => {
  const mail = applicationUpdateEmail({ jobTitle: "Optician", clinicName: "Brightview", label: "Interview", message: "", applicationId: "a1", site: "https://eyecarejobs.ca" });
  assert.doesNotMatch(mail.text, /written by/);
});

test("the inbox message keeps the writer line even when the message is long", () => {
  const msg = applicationMoved({ jobTitle: "Optician", clinicName: "Brightview", status: "interview", label: "Interview", message: "x".repeat(1500), applicationId: "a1" });
  const body = msg?.body ?? "";
  assert.ok(body.endsWith("This message was written by Brightview."), body.slice(-60));
  assert.ok(body.length <= 480);
  const short = applicationMoved({ jobTitle: "Optician", clinicName: "Brightview", status: "interview", label: "Interview", message: "See you Monday.", applicationId: "a1" });
  assert.equal(short?.body, "See you Monday. This message was written by Brightview.");
});

test("tellCandidate builds its email with applicationUpdateEmail", () => {
  const source = readFileSync(new URL("./applicant-actions.ts", import.meta.url), "utf8");
  assert.match(source, /applicationUpdateEmail\(\{/);
});
