import "server-only";
import { revalidatePath } from "next/cache";

// Job pages are saved and shared for up to 5 minutes, and the province and role pages for up to 5 minutes too (audit P1-10). Whenever a
// job or a clinic changes (approved, edited, closed, extended, filled, taken down, expired, claimed, a clinic's name or about text, an
// account deleted), call this so every saved copy is thrown away at once and the next visitor sees the change. It clears every job page,
// not only the one that changed: a clinic's details appear on all its jobs, and clearing a few extra pages costs almost nothing.
// lib/job-cache.test.ts checks that every place that changes a job or a clinic calls it.
export function refreshJobPages() {
  try {
    revalidatePath("/"); // the home page lists the latest jobs once Kestrel has launched (X-05)
    revalidatePath("/jobs");
    revalidatePath("/jobs/[id]", "page");
    revalidatePath("/clinics/[slug]", "page"); // clinic pages list each clinic's open jobs
    revalidatePath("/companies/[slug]", "page"); // and so do supplier pages
    revalidatePath("/eye-care-jobs", "layout");
  } catch (error) {
    // Only possible outside a request (a test or a script). The saved copies then run out by themselves within 5 minutes.
    console.error("Could not clear saved job pages:", error instanceof Error ? error.message : error);
  }
}
