import type { Metadata } from "next";
import LaunchHome from "@/components/LaunchHome";

// A look at the launch home page before launch (docs/launch-home.md). Not listed anywhere, and kept out of search results.
export const metadata: Metadata = { title: "Launch home page preview | Kestrel Eye Care Jobs", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default function LaunchPreview() {
  return <LaunchHome />;
}
