"use server";

import { redirect } from "next/navigation";
import { unsubscribeByAddress, unsubscribeById } from "@/lib/unsubscribe-core";

// Stops marketing email for a waitlist sign up or an account. The page gives the same
// answer whether or not the code matches anyone, so it cannot be used to check who is
// on our lists.
export async function unsubscribe(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!(await unsubscribeById(id, String(form.get("s") ?? "")))) redirect("/");
  redirect(`/unsubscribe/${id}?done=1`);
}

// The unsubscribe for an email address with no account, such as a clinic we wrote to. The link
// carries a signature, so only a link we sent can unsubscribe an address.
export async function unsubscribeAddress(form: FormData) {
  if (!(await unsubscribeByAddress(String(form.get("e") ?? ""), String(form.get("s") ?? "")))) redirect("/unsubscribe/address?problem=1");
  redirect("/unsubscribe/address?done=1");
}
