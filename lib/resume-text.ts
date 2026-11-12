import "server-only";
import { unzipSync, strFromU8 } from "fflate";
import { extractText, getDocumentProxy } from "unpdf";

// Gets the plain text out of a saved resume, on Kestrel's own server, for "Fill in from my resume". PDF and Word (.docx) only. Nothing is stored
// and nothing is sent anywhere: the text lives for the length of one request. The limits below are there so a strange file can only waste a little time.
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_TEXT = 200_000;
const MAX_XML = 1024 * 1024;
const MAX_PAGES = 12;
const SECONDS = 8;

export type TextResult = { ok: true; text: string } | { ok: false; reason: "unsupported" | "empty" | "failed" };

function withTimeout<T>(work: Promise<T>): Promise<T> {
  return Promise.race([work, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timed out")), SECONDS * 1000))]);
}

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

async function textFromPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: false });
  return (Array.isArray(text) ? text.slice(0, MAX_PAGES) : [text]).join("\n").slice(0, MAX_TEXT);
}

export async function resumeText(bytes: Uint8Array, filename: string): Promise<TextResult> {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return { ok: false, reason: "failed" };
  const name = filename.toLowerCase();
  try {
    let text = "";
    if (name.endsWith(".pdf")) text = await withTimeout(textFromPdf(bytes));
    else if (name.endsWith(".docx")) text = textFromDocx(bytes);
    else return { ok: false, reason: "unsupported" };
    return text.trim().length < 20 ? { ok: false, reason: "empty" } : { ok: true, text };
  } catch (e) {
    console.error("Reading a resume failed:", e instanceof Error ? e.message : e);
    return { ok: false, reason: "failed" };
  }
}
