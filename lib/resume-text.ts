import "server-only";
import { unzipSync, strFromU8 } from "fflate";
import { getDocumentProxy } from "unpdf";

// Gets the plain text out of a saved resume, on Kestrel's own server, for "Fill in from my resume". PDF and Word (.docx) only. Nothing is stored
// and nothing is sent anywhere: the text lives for the length of one request. The limits below are there so a strange file can only waste a little time.
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_TEXT = 200_000;
const MAX_XML = 1024 * 1024;
const MAX_PAGES = 12;
const SECONDS = 8;

export type TextResult = { ok: true; text: string } | { ok: false; reason: "unsupported" | "empty" | "failed" };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeEntities(text: string): string {
  return text.includes("&") ? text.replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => ENTITIES[name]) : text;
}

// Turns Word's XML into plain text by walking it once from start to end, so the time taken grows in step with the size of the file and a file
// built to be awkward (thousands of "<" with no ">") costs no more than an ordinary one. Paragraph ends and line breaks become new lines, a tab
// becomes a space, every other tag is dropped, and the 5 XML entities are decoded.
export function textFromWordXml(xml: string): string {
  const out: string[] = [];
  let length = 0;
  let at = 0;
  while (at < xml.length && length < MAX_TEXT) {
    const open = xml.indexOf("<", at);
    // A "<" that is never closed is not a tag. There is nothing more to drop, so the rest is text.
    const close = open === -1 ? -1 : xml.indexOf(">", open + 1);
    if (close === -1) {
      out.push(decodeEntities(xml.slice(at, at + MAX_TEXT)));
      break;
    }
    if (open > at) {
      const text = decodeEntities(xml.slice(at, open));
      out.push(text);
      length += text.length;
    }
    at = close + 1;
    if (close === open + 1) {
      // "<>" is not a tag, so it stays as text.
      out.push("<>");
      length += 2;
      continue;
    }
    const selfClosing = xml[close - 1] === "/";
    let piece = "";
    if (xml.startsWith("/w:p>", open + 1)) piece = "\n";
    else if (selfClosing && (xml.startsWith("w:br", open + 1) || xml.startsWith("w:cr", open + 1)) && !/\w/.test(xml[open + 5])) piece = "\n";
    else if (selfClosing && xml.startsWith("w:tab", open + 1) && !/\w/.test(xml[open + 6])) piece = " ";
    if (piece) {
      out.push(piece);
      length += 1;
    }
  }
  return out.join("").slice(0, MAX_TEXT);
}

// A Word .docx file is a zip with the words in word/document.xml. The zip says how large that part is before it is unzipped, and anything
// over the limit is refused without being opened. A real resume's document.xml is far smaller.
export function textFromDocx(bytes: Uint8Array): string {
  let tooLarge = false;
  const files = unzipSync(bytes, {
    filter: (f) => {
      if (f.name !== "word/document.xml") return false;
      if (f.originalSize > MAX_XML) tooLarge = true;
      return !tooLarge;
    },
  });
  if (tooLarge) throw new Error("the Word document inside is too large");
  const xml = files["word/document.xml"];
  if (!xml) return "";
  if (xml.byteLength > MAX_XML) throw new Error("the Word document inside is too large");
  return textFromWordXml(strFromU8(xml));
}

// Counts the PDF pages opened since the server started. Only the tests read it, to prove that pages past the limit are never opened.
let opened = 0;
export function pagesOpened(): number {
  return opened;
}

// Reads a PDF 1 page at a time and stops at 12 pages or when the time is up, whichever comes first, so a file with thousands of pages costs
// no more than a 12 page one. Whatever was read by then is kept. The timer is always cleared and the document is always closed, which also
// stops any page still being worked on.
export async function textFromPdf(bytes: Uint8Array, limitMs: number = SECONDS * 1000): Promise<string> {
  const deadline = Date.now() + limitMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeUp = new Promise<"time up">((resolve) => {
    timer = setTimeout(() => resolve("time up"), Math.max(0, limitMs));
  });
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | undefined;
  try {
    const loading = getDocumentProxy(bytes);
    const loaded = await Promise.race([loading, timeUp]);
    if (loaded === "time up") {
      // The file was still opening when the time ran out. Close it when it does open.
      loading.then((late) => late.loadingTask.destroy(), () => {}).catch(() => {});
      throw new Error("timed out");
    }
    pdf = loaded;
    const pages: string[] = [];
    let length = 0;
    const last = Math.min(pdf.numPages, MAX_PAGES);
    for (let n = 1; n <= last && length < MAX_TEXT; n++) {
      if (Date.now() >= deadline) break;
      opened++;
      const doc = pdf;
      const page = await Promise.race([
        doc.getPage(n).then((p) => p.getTextContent()).then((content) => content.items.map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : "") : "")).join("")),
        timeUp,
      ]);
      if (page === "time up") break;
      pages.push(page);
      length += page.length + 1;
    }
    if (pages.length === 0 && last > 0) throw new Error("timed out");
    return pages.join("\n").slice(0, MAX_TEXT);
  } finally {
    clearTimeout(timer);
    if (pdf) await pdf.loadingTask.destroy().catch(() => {});
  }
}

export async function resumeText(bytes: Uint8Array, filename: string): Promise<TextResult> {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return { ok: false, reason: "failed" };
  const name = filename.toLowerCase();
  try {
    let text = "";
    if (name.endsWith(".pdf")) text = await textFromPdf(bytes);
    else if (name.endsWith(".docx")) text = textFromDocx(bytes);
    else return { ok: false, reason: "unsupported" };
    return text.trim().length < 20 ? { ok: false, reason: "empty" } : { ok: true, text };
  } catch (e) {
    console.error("Reading a resume failed:", e instanceof Error ? e.message : e);
    return { ok: false, reason: "failed" };
  }
}
