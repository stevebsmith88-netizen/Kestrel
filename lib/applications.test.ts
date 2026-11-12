// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLOSED,
  activeContent,
  STEPS,
  CANDIDATE_STEPS,
  HIREABLE,
  candidateHistory,
  candidateStatus,
  clinicMoveError,
  detectCv,
  groupOf,
  isClosed,
  messageTemplate,
  reachedStep,
  safeFilename,
  wordCount,
} from "./applications.ts";

test("statuses group the way the candidate sees them", () => {
  assert.equal(groupOf("applied"), "review");
  assert.equal(groupOf("viewed"), "review");
  assert.equal(groupOf("shortlisted"), "review");
  assert.equal(groupOf("interview"), "interview");
  assert.equal(groupOf("offer"), "offer");
  for (const s of CLOSED) assert.equal(groupOf(s), "closed", s);
  assert.equal(isClosed("applied"), false);
});

test("progress comes from how far the application got", () => {
  assert.equal(reachedStep(["applied", "viewed", "shortlisted"], "not_selected"), 2);
  assert.equal(reachedStep(["applied"], "role_filled"), 0);
  assert.equal(reachedStep(["applied", "viewed"], "interview"), 3);
  assert.equal(STEPS.length, 6, "a clinic sees 6 steps, ending with Hired");
});

test("a clinic cannot make a move it should not", () => {
  assert.equal(clinicMoveError("applied", "shortlisted", false, ""), null);
  assert.ok(clinicMoveError("withdrawn", "shortlisted", false, ""));
  assert.ok(clinicMoveError("applied", "applied", false, ""));
  assert.ok(clinicMoveError("applied", "viewed", false, ""));
  assert.ok(clinicMoveError("applied", "no_update", false, ""));
  assert.ok(clinicMoveError("shortlisted", "kept", false, "Thanks"));
  assert.equal(clinicMoveError("shortlisted", "kept", true, "Thanks"), null);
});

test("closing and offering needs a message with no blanks left in it", () => {
  assert.ok(clinicMoveError("viewed", "not_selected", false, "   "));
  assert.equal(clinicMoveError("viewed", "not_selected", false, messageTemplate("not_selected", "Harbourside Optical")), null);
  assert.ok(clinicMoveError("viewed", "interview", false, messageTemplate("interview", "Harbourside Optical")));
  assert.equal(clinicMoveError("viewed", "interview", false, "Harbourside Optical would like to meet you on Friday at 2 pm by video."), null);
});

test("messages are kind and name the clinic", () => {
  for (const s of ["not_selected", "role_filled", "kept", "interview", "offer"]) {
    assert.ok(messageTemplate(s, "Harbourside Optical").includes("Harbourside Optical"), s);
  }
  assert.ok(!messageTemplate("not_selected", "X").toLowerCase().includes("reject"));
  assert.equal(messageTemplate("applied", "X"), "");
  assert.equal(messageTemplate("shortlisted", "X"), "", "shortlisting is the clinic's own list, so it has no message");
});

test("CV files are recognised by what is inside them", () => {
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
  const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
  const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  assert.equal(detectCv(pdf, "My CV.pdf")?.ext, "pdf");
  assert.equal(detectCv(zip, "cv.docx")?.ext, "docx");
  assert.equal(detectCv(ole, "cv.doc")?.ext, "doc");
  assert.equal(detectCv(pdf, "cv.docx"), null); // wrong name for what it is
  assert.equal(detectCv(zip, "cv.pdf"), null);
  assert.equal(detectCv(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]), "cv.pdf"), null); // a program pretending to be a PDF
  assert.equal(detectCv(new Uint8Array([]), "cv.pdf"), null);
});

test("file names are made safe", () => {
  assert.equal(safeFilename("../../etc/passwd.pdf"), "etcpasswd.pdf");
  assert.equal(safeFilename("My CV (2026).pdf"), "My CV (2026).pdf");
  assert.equal(safeFilename("???"), "cv");
});

test("word count", () => {
  assert.equal(wordCount(""), 0);
  assert.equal(wordCount("  hello   there world "), 3);
});

test("a CV with macros, scripts or embedded programs is refused, and ordinary ones are not", () => {
  const bytes = (text: string) => new TextEncoder().encode(text);
  const utf16 = (text: string) => new Uint8Array(Buffer.from(text, "utf16le"));
  // PDFs
  assert.equal(activeContent(bytes("%PDF-1.7\n1 0 obj << /Type /Catalog /OpenAction [3 0 R /Fit] >> endobj"), "pdf"), null);
  assert.ok(activeContent(bytes("%PDF-1.7\n1 0 obj << /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >>"), "pdf"));
  assert.ok(activeContent(bytes("%PDF-1.4\n<< /S /Launch /F (cmd.exe) >>"), "pdf"));
  assert.ok(activeContent(bytes("%PDF-1.4\n<< /Type /EmbeddedFile /Length 5 >>"), "pdf"));
  assert.equal(activeContent(bytes("%PDF-1.7\n<< /Type /Page /Resources << /Font << /F1 5 0 R >> >> >>"), "pdf"), null);
  // Word
  assert.equal(activeContent(bytes("PK\u0003\u0004word/document.xml word/styles.xml [Content_Types].xml"), "docx"), null);
  assert.ok(activeContent(bytes("PK\u0003\u0004word/document.xml word/vbaProject.bin"), "docx"));
  assert.ok(activeContent(bytes("PK\u0003\u0004word/embeddings/oleObject1.bin"), "docx"));
  assert.equal(activeContent(utf16("Root Entry WordDocument 1Table SummaryInformation"), "doc"), null);
  assert.ok(activeContent(utf16("Root Entry Macros _VBA_PROJECT_CUR"), "doc"));
  assert.ok(activeContent(utf16("Root Entry \u0001Ole10Native"), "doc"));
});

test("bulk moves: a shortlist needs no message, an interview invitation needs a finished one", () => {
  assert.equal(clinicMoveError("viewed", "shortlisted", true, ""), null);
  assert.ok(clinicMoveError("viewed", "interview", true, ""), "an interview invitation needs a message");
  assert.ok(clinicMoveError("viewed", "interview", true, "Come on [date]"), "square brackets must be filled in");
  assert.equal(clinicMoveError("shortlisted", "interview", true, "Please come on Tuesday at 2 pm."), null);
  assert.ok(clinicMoveError("shortlisted", "shortlisted", true, ""), "already shortlisted is skipped");
});

test("a candidate never sees Shortlisted: it shows as Viewed, once, in their history", () => {
  assert.equal(candidateStatus("shortlisted"), "viewed");
  assert.equal(candidateStatus("interview"), "interview");
  assert.equal(candidateStatus("applied"), "applied");
  const events = [{ status: "applied" }, { status: "viewed" }, { status: "shortlisted" }, { status: "interview" }];
  assert.deepEqual(candidateHistory(events).map((e) => e.status), ["applied", "viewed", "interview"]);
  assert.deepEqual(candidateHistory([{ status: "applied" }, { status: "shortlisted" }]).map((e) => e.status), ["applied", "viewed"], "shortlisted straight from applied still shows a Viewed step");
});

test("a candidate's progress bar has 5 steps and never shows Shortlisted", () => {
  assert.deepEqual([...CANDIDATE_STEPS], ["applied", "viewed", "interview", "offer", "hired"]);
  assert.equal(reachedStep(["applied", "viewed"], "interview", CANDIDATE_STEPS), 2);
  assert.equal(reachedStep(["applied", "viewed"], "not_selected", CANDIDATE_STEPS), 1);
  assert.equal(reachedStep(["applied", "viewed", "shortlisted"], "not_selected"), 2, "a clinic still sees 5 steps");
});

test("Hired is a final step: no more moves, it sits with the offers, and its message is warm and names the clinic", () => {
  assert.ok(clinicMoveError("hired", "interview", true, "Come on Tuesday."), "a hired person cannot be moved on");
  assert.equal(groupOf("hired"), "offer");
  assert.equal(isClosed("hired"), false);
  assert.equal(candidateStatus("hired"), "hired");
  assert.ok(messageTemplate("hired", "Harbourside Optical").includes("Harbourside Optical"));
  assert.ok(!/\[[^\]]+\]/.test(messageTemplate("hired", "X")), "no square brackets to fill in");
  assert.equal(reachedStep(["applied", "viewed", "interview", "offer"], "hired"), 5);
  assert.deepEqual([...HIREABLE], ["applied", "viewed", "shortlisted", "interview", "offer"], "only someone still in the running can be named");
});

// Audit P1-31: a clinic cannot move someone back to Shortlisted from a later step, because the candidate would see Interview turn back into Viewed.
test("a clinic cannot move an application back to Shortlisted from Interview or Offer", () => {
  assert.ok(clinicMoveError("interview", "shortlisted", false, ""));
  assert.ok(clinicMoveError("offer", "shortlisted", false, ""));
  assert.match(clinicMoveError("interview", "shortlisted", false, "") ?? "", /Interview/);
  assert.match(clinicMoveError("offer", "shortlisted", false, "") ?? "", /Offer/);
  // the forward moves and the first shortlist still work
  assert.equal(clinicMoveError("applied", "shortlisted", false, ""), null);
  assert.equal(clinicMoveError("viewed", "shortlisted", false, ""), null);
  assert.equal(clinicMoveError("shortlisted", "interview", false, "Come in on Friday at 2 pm."), null);
  assert.equal(clinicMoveError("interview", "offer", false, "We would like to offer you the role, please reply by Friday."), null);
});
