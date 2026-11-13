import Image from "next/image";
import Link from "next/link";
import { parseBlocks, parseInline } from "@/lib/blog";
import { BLOG_IMAGES } from "@/lib/blog-images";

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
// A pull quote with no source repeats a line from the post, so screen readers skip it. An image not listed in lib/blog-images.ts is left out.
export default function BlogBody({ body }: { body: string }) {
  return (
    <>
      {parseBlocks(body).map((b, i) =>
        b.type === "h2" ? <h2 key={i}>{b.text}</h2>
        : b.type === "quote" ? (
          <figure key={i} className={b.source ? "pullquote cited" : "pullquote"} aria-hidden={b.source ? undefined : true}>
            <blockquote><p><Inline text={b.text} /></p></blockquote>
            {b.source && <figcaption>{b.source}</figcaption>}
          </figure>
        )
        : b.type === "table" ? (
          <div key={i} className="tablewrap blogtable">
            <table className="table">
              <thead><tr>{b.head.map((h, j) => <th key={j} scope="col">{h}</th>)}</tr></thead>
              <tbody>{b.rows.map((row, r) => <tr key={r}>{row.map((c, j) => (j === 0 ? <th key={j} scope="row"><Inline text={c} /></th> : <td key={j}><Inline text={c} /></td>))}</tr>)}</tbody>
            </table>
          </div>
        )
        : b.type === "figure" ? (BLOG_IMAGES[b.src] ? (
          <figure key={i} className={BLOG_IMAGES[b.src].width / BLOG_IMAGES[b.src].height >= 1.3 ? "blogfig wide" : "blogfig"}>
            <Image src={b.src} alt={b.alt} width={BLOG_IMAGES[b.src].width} height={BLOG_IMAGES[b.src].height} sizes={BLOG_IMAGES[b.src].width / BLOG_IMAGES[b.src].height >= 1.3 ? "(max-width: 800px) 100vw, 760px" : "(max-width: 720px) 80vw, 300px"} priority={i === 0} />
            {b.caption && <figcaption>{b.caption}</figcaption>}
          </figure>
        ) : null)
        : b.type === "ul" ? <ul key={i}>{b.items.map((item, j) => <li key={j}><Inline text={item} /></li>)}</ul>
        : <p key={i}><Inline text={b.text} /></p>,
      )}
    </>
  );
}
