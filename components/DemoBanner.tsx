import { DEMO_BANNER, demoMode } from "@/lib/demo";

// A thin bar across the top of every page of the demo site. It renders nothing on the live site.
export default function DemoBanner() {
  if (!demoMode()) return null;
  return <p className="demobar" role="note"><strong>Demo site.</strong> {DEMO_BANNER}</p>;
}
