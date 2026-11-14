"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";
import { openBillingPortal, passesAvailable, startPassCheckout } from "@/lib/pass-flow";

// The Plans page buttons. Only the clinic owner can start, change or cancel a pass, and only for the location they are working in.
async function owner() {
  const session = await requireRole("clinic");
  const employer = await getMyEmployer(session.userId);
  if (!employer) redirect("/clinic/profile");
  if (!passesAvailable()) redirect("/clinic");
  if (employer.level !== "owner") redirect("/clinic/plans?problem=owner");
  return employer;
}

export async function choosePlan(form: FormData) {
  const employer = await owner();
  const result = await startPassCheckout(employer.id, String(form.get("plan") ?? ""));
  if ("url" in result) redirect(result.url);
  redirect(`/clinic/plans?problem=${result.error}${result.detail ? `&why=${encodeURIComponent(result.detail.slice(0, 200))}` : ""}`);
}

export async function manageBilling() {
  const employer = await owner();
  const result = await openBillingPortal(employer.id);
  if ("url" in result) redirect(result.url);
  redirect(`/clinic/plans?problem=portal&why=${encodeURIComponent(result.error.slice(0, 200))}`);
}
