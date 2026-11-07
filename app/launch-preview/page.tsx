import type { Metadata } from "next";
import LaunchHome from "@/components/LaunchHome";
import PreLaunchHome from "@/components/PreLaunchHome";

// A look at the new home page before it is live (docs/launch-home.md). /launch-preview is the launch page, and
// /launch-preview?mode=prelaunch is the new look before launch, with the waitlist. Not linked anywhere, and kept out of search results.
export const metadata: Metadata = { title: "New home page preview | Kestrel Eye Care Jobs", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function LaunchPreview({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  return (await searchParams).mode === "prelaunch" ? <PreLaunchHome /> : <LaunchHome />;
}
