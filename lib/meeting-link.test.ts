// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanMeetingLink, splitMeetingLink, withMeetingLink } from "./meeting-link.ts";

test("accepts the common meeting services and keeps the password part", () => {
  assert.equal(cleanMeetingLink("https://us02web.zoom.us/j/123456789?pwd=abc123").url, "https://us02web.zoom.us/j/123456789?pwd=abc123");
  assert.equal(cleanMeetingLink("meet.google.com/abc-defg-hij").url, "https://meet.google.com/abc-defg-hij");
  assert.equal(cleanMeetingLink("https://teams.microsoft.com/l/meetup-join/19%3ameeting").url, "https://teams.microsoft.com/l/meetup-join/19%3ameeting");
  assert.equal(cleanMeetingLink("").url, "");
});

test("refuses anything that is not a meeting service, plain http, or a look alike address", () => {
  for (const bad of ["https://evil.example.com/login", "http://zoom.us/j/123", "https://zoom.us.evil.com/j/123", "https://evilzoom.us/j/123", "https://user:pw@zoom.us/j/1", "https://zoom.us", "javascript:alert(1)", "https://zoom.us/j/1 2"]) {
    assert.ok(cleanMeetingLink(bad).error, bad);
  }
});

test("the link rides as the last line of the message and splits back out", () => {
  const saved = withMeetingLink("See you Monday.", "https://zoom.us/j/123456789");
  assert.equal(saved, "See you Monday.\n\nJoin the meeting: https://zoom.us/j/123456789");
  assert.deepEqual(splitMeetingLink(saved), { text: "See you Monday.", link: "https://zoom.us/j/123456789" });
});

test("a line that only looks like a meeting link stays plain text", () => {
  const text = "Hi.\n\nJoin the meeting: https://evil.example.com/login";
  assert.deepEqual(splitMeetingLink(text), { text, link: null });
  assert.deepEqual(splitMeetingLink(null), { text: "", link: null });
});
