// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { LAST_STEP, nextDueAt, outreachSequenceEmail, stopReason } from "./outreach-sequence.ts";

const UNSUB = "https://eyecarejobs.ca/unsubscribe/address?a=x&s=y";
const DAY = 24 * 60 * 60 * 1000;

test("the 4 emails go on day 1, 8, 18 and 32, then stop", () => {
  const start = new Date("2026-12-01T15:00:00Z");
  const second = nextDueAt(1, start)!;
  const third = nextDueAt(2, second)!;
  const fourth = nextDueAt(3, third)!;
  assert.deepEqual([second, third, fourth].map((d) => Math.round((d.getTime() - start.getTime()) / DAY) + 1), [8, 18, 32]);
  assert.equal(nextDueAt(LAST_STEP, fourth), null);
});

test("every email in the sequence meets CASL: who we are, address, unsubscribe and the reason", () => {
  for (let step = 1; step <= LAST_STEP; step += 1) {
    const mail = outreachSequenceEmail({ step, clinicName: "Lakeside Eye Care", unsubscribeUrl: UNSUB });
    for (const body of [mail.html, mail.text]) {
      assert.ok(body.includes("Kestrel Eye Care Jobs"));
      assert.ok(body.includes("6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2"));
      assert.ok(body.includes("published on its website for business enquiries"));
      assert.ok(body.includes("Lakeside Eye Care"));
    }
    assert.ok(mail.html.includes(UNSUB.replace(/&/g, "&amp;")));
    assert.ok(mail.text.includes(UNSUB));
    assert.ok(mail.html.includes("/clinics"));
  }
});

test("each email has its own subject, and only the first carries the full price list", () => {
  const mails = [1, 2, 3, 4].map((step) => outreachSequenceEmail({ step, clinicName: "Lakeside Eye Care", unsubscribeUrl: UNSUB }));
  assert.equal(new Set(mails.map((m) => m.subject)).size, 4);
  assert.ok(mails[0].html.includes("$39.80"));
  assert.ok(!mails[1].html.includes("$39.80"));
  assert.ok(mails[2].text.includes("$99 for optometrists"));
});

test("the last email leaves the door open rather than saying goodbye", () => {
  const mail = outreachSequenceEmail({ step: 4, clinicName: "Lakeside Eye Care", unsubscribeUrl: UNSUB });
  assert.ok(mail.text.includes("Whenever you're next hiring"));
  assert.ok(!/last (one|email)/i.test(mail.text));
});

test("a clinic name cannot break the email", () => {
  const mail = outreachSequenceEmail({ step: 1, clinicName: "<b>Eyes & Co</b>", unsubscribeUrl: UNSUB });
  assert.ok(mail.html.includes("&lt;b&gt;Eyes &amp; Co&lt;/b&gt;"));
});

test("the sequence stops for an unsubscribe, a sign up or a claim", () => {
  const none = { suppressed: false, onWaitlist: false, hasAccount: false, claimed: false };
  assert.equal(stopReason(none), null);
  assert.equal(stopReason({ ...none, suppressed: true }), "unsubscribed");
  assert.equal(stopReason({ ...none, onWaitlist: true }), "joined");
  assert.equal(stopReason({ ...none, hasAccount: true }), "joined");
  assert.equal(stopReason({ ...none, claimed: true }), "claimed");
});

test("a clinic's own domain matches its whole team, but a Gmail address only matches itself", async () => {
  const { sameClinicPattern } = await import("./outreach-sequence.ts");
  assert.equal(sameClinicPattern("Hiring@LakesideEye.ca"), "%@lakesideeye.ca");
  assert.equal(sameClinicPattern("lakesideeye@gmail.com"), "lakesideeye@gmail.com");
  assert.equal(sameClinicPattern("frontdesk@shaw.ca"), "frontdesk@shaw.ca");
});
