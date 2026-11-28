import Link from "next/link";

// "View my public page" for a clinic or company (Steve, 15th November 2026), shown beside the page heading. The page exists once Kestrel has
// approved 1 of its jobs, so until then a short line says when it will appear, instead of a link that leads nowhere.
export function PublicPageButton({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <Link href={href} className="btn sm ghost" target="_blank">View my public page<span className="sr"> (opens in a new tab)</span></Link>
  );
}

export function PublicPageNote({ href, supplier = false }: { href: string | null; supplier?: boolean }) {
  if (href) return null;
  return <p className="help">Your public page appears once Kestrel has approved your first job. It lists your open jobs and your {supplier ? "company" : "clinic"} links.</p>;
}
