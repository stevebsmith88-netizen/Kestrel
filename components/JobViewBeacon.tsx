"use client";

import { useEffect } from "react";
import { trackJobEvent } from "@/components/trackJobEvent";

// Counts one view per job for each browser tab, so refreshing the page does not add to the count. It uses
// the tab's own short term storage, not a cookie, and leaves the page unchanged.
export default function JobViewBeacon({ jobId }: { jobId: string }) {
  useEffect(() => {
    try {
      const key = `kestrel-viewed-${jobId}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage can be blocked. Count the view anyway.
    }
    trackJobEvent(jobId, "view");
  }, [jobId]);
  return null;
}
