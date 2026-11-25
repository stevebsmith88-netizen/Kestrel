// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { addDismissed, MAX_DISMISSED, parseDismissed, visibleNotices } from "./notice-dismiss.ts";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("an empty or damaged cookie reads as nothing dismissed", () => {
  assert.deepEqual(parseDismissed(undefined), []);
  assert.deepEqual(parseDismissed(""), []);
  assert.deepEqual(parseDismissed("not an id,<script>"), []);
});

test("new ids are added once, and anything that is not an id is ignored", () => {
  const first = addDismissed(undefined, [id(1), id(2), "junk"]);
  assert.deepEqual(parseDismissed(first), [id(1), id(2)]);
  assert.deepEqual(parseDismissed(addDismissed(first, [id(2), id(3)])), [id(1), id(2), id(3)]);
});

test("only the newest few are kept, so the cookie never grows without limit", () => {
  const ids = Array.from({ length: MAX_DISMISSED + 5 }, (_, i) => id(i + 1));
  const kept = parseDismissed(addDismissed(undefined, ids));
  assert.equal(kept.length, MAX_DISMISSED);
  assert.equal(kept[kept.length - 1], id(MAX_DISMISSED + 5));
});

test("a dismissed approval is hidden, but a message that needs a change never is", () => {
  const notices = [
    { id: id(1), kind: "approved" },
    { id: id(2), kind: "approved" },
    { id: id(3), kind: "needs-change" },
  ];
  assert.deepEqual(visibleNotices(notices, [id(1), id(3)]).map((n) => n.id), [id(2), id(3)]);
  assert.equal(visibleNotices(notices, []).length, 3);
});

test("2 approvals are shown 1 each, and more than 2 fold into 1 message (P1-39)", async () => {
  const { foldApprovals } = await import("./notice-dismiss.ts");
  const job = (n: number) => ({ id: `id${n}`, title: `Job ${n}` });
  assert.deepEqual(foldApprovals([]), { fold: false });
  assert.deepEqual(foldApprovals([job(1), job(2)]), { fold: false });
  const three = foldApprovals([job(1), job(2), job(3)]);
  assert.ok(three.fold);
  if (three.fold) {
    assert.deepEqual(three.ids, ["id1", "id2", "id3"]);
    assert.equal(three.text, "3 of your jobs have been approved and are now live: Job 1, Job 2 and Job 3. Candidates can see them and apply.");
  }
  const five = foldApprovals([1, 2, 3, 4, 5].map(job));
  assert.ok(five.fold);
  if (five.fold) {
    assert.equal(five.ids.length, 5);
    assert.match(five.text, /^5 of your jobs .*: Job 1, Job 2, Job 3 and 2 more\./);
  }
});
