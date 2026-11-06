"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackJobEvent } from "@/components/trackJobEvent";

// The Apply button on a job page. It works as a normal link, and also counts the click for the clinic.
export default function ApplyLink({ jobId, href, external, children }: { jobId: string; href: string; external?: boolean; children: ReactNode }) {
  const onClick = () => trackJobEvent(jobId, "apply_click");
  if (external) {
    return (
      <a href={href} className="btn" target="_blank" rel="nofollow noopener noreferrer" onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="btn" onClick={onClick}>
      {children}
    </Link>
  );
}
