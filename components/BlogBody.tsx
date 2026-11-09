import Link from "next/link";
import { parseBlocks, parseInline } from "@/lib/blog";

// `sameDocument` turns a link such as /help#post-a-job into a plain #post-a-job link, so a click on a page that is already open fires the browser's own hashchange.
export function Inline({ text, sameDocument = false }: { text: string; sameDocument?: boolean }) {
  return (
    <>
      {parseInline(text).map((part, i) =>
        part.type === "bold" ? <strong key={i}>{part.text}</strong>
        : part.type === "link" ? (sameDocument && part.href.startsWith("/help#") ? <a key={i} href={part.href.slice(5)}>{part.text}</a> : part.href.startsWith("/") ? <Link key={i} href={part.href}>{part.text}</Link> : <a key={i} href={part.href} rel="noopener noreferrer">{part.text}</a>)
        : <span key={i}>{part.text}</span>,
      )}
    </>
  );
}

// Shows a blog post's text. Everything is rendered as ordinary page text, never as raw HTML.
export default function BlogBody({ body }: { body: string }) {
  return (
    <>
      {parseBlocks(body).map((b, i) =>
        b.type === "h2" ? <h2 key={i}>{b.text}</h2>
        : b.type === "ul" ? <ul key={i}>{b.items.map((item, j) => <li key={j}><Inline text={item} /></li>)}</ul>
        : <p key={i}><Inline text={b.text} /></p>,
      )}
    </>
  );
}
