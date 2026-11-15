import Link from "next/link";
import { clinicHrefFor } from "@/lib/public-clinics";

// "View my public page" for a clinic or company (Steve, 15th November 2026). The page exists once Kestrel has approved 1 of its jobs, so until
// then a short line says when it will appear, instead of a link that leads nowhere.
export default async function PublicPageLink({ employerId, supplier = false }: { employerId: string; supplier?: boolean }) {
  const href = await clinicHrefFor(employerId);
  if (!href) {
    return <p className="help">Your public page appears once Kestrel has approved your first job. It lists your open jobs and your {supplier ? "company" : "clinic"} links.</p>;
  }
  return (
    <p>
      <Link href={href} className="btn sm ghost" target="_blank">View my public page<span className="sr"> (opens in a new tab)</span></Link>
    </p>
  );
}
