"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { isJobId, setSaved } from "@/lib/saved-server";

// Remove a saved job from the Saved jobs page.
export async function removeSaved(form: FormData) {
  const session = await requireRole("candidate");
  const id = String(form.get("jobId") ?? "");
  if (isJobId(id)) await setSaved(session, id, false);
  revalidatePath("/candidate/saved");
}
