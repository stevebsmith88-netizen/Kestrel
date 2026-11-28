"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getMyClinics, LOCATION_COOKIE } from "@/lib/clinic";

// Switches the location a person is working in (phase B, migration 0047). Only one of their own locations can be picked.
export async function switchLocation(form: FormData) {
  const session = await requireRole("clinic");
  const id = String(form.get("location") ?? "");
  const back = String(form.get("back") ?? "/clinic");
  const mine = await getMyClinics(session.userId);
  if (mine.some((c) => c.id === id)) {
    (await cookies()).set(LOCATION_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 86_400 });
  }
  redirect(back.startsWith("/clinic") || back.startsWith("/account") ? back : "/clinic");
}
