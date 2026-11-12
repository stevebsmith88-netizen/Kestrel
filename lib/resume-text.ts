import "server-only";
import { unzipSync, strFromU8 } from "fflate";
import { extractText, getDocumentProxy } from "unpdf";

// Gets the plain text out of a saved resume, on Kestrel's own server, for "Fill in from my resume". PDF and Word (.docx) only. Nothing is stored
// and nothing is sent anywhere: the text lives for the length of one request. The limits below are there so a strange file can only waste a little time.
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_TEXT = 200_000;
const MAX_XML = 8 * 1024 * 1024;
const MAX_PAGES = 12;
const SECONDS = 8;

export type TextResult = { ok: true; text: string } | { ok: false; reason: "unsupported" | "empty" | "failed" };

function withTimeout<T>(work: Promise<T>): Promise<T> {
  return Promise.race([work, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timed out")), SECONDS * 1000))]);
}

// A Word .docx file is a zip with the words in word/document.xml. Paragraph and line ends become new lines, the other tags are dropped.
export function textFromDocx(bytes: Uint8Array): string {
  const files = unzipSync(bytes, { filter: (f) => f.name === "word/document.xml" && f.originalSize <= MAX_XML });
  const xml = files["word/document.xml"];
  if (!xml) return "";
  return strFromU8(xml)
    .replace(/<w:(?:br|cr)\b[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\b[^>]*\/>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .slice(0, MAX_TEXT);
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
