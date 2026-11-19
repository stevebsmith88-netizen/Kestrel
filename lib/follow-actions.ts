"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { isEmployerId, setFollow } from "@/lib/follow-server";

// Unfollow from the list on the Job alerts page.
export async function unfollow(form: FormData) {
  const session = await requireRole("candidate");
  const id = String(form.get("employerId") ?? "");
  if (isEmployerId(id)) await setFollow(session, id, false);
  revalidatePath("/candidate/alerts");
}
