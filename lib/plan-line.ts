import "server-only";
import { cookies } from "next/headers";
import { getMyClinics, LOCATION_COOKIE } from "@/lib/clinic";
import { passesAvailable } from "@/lib/pass-flow";
import { planByKey, planLineText } from "@/lib/passes";
import { supabaseAdmin } from "@/lib/supabase-server";

// The line under the name in a clinic's account menu: "Clinic account · Clinic pass" (or "Single posts"), for the location being worked in. Used by the
// bar on dashboard pages and by /api/me for the saved public pages. A problem gives the plain line, so the menu never fails.
export async function planLineFor(userId: string): Promise<string> {
  try {
    const on = passesAvailable();
    if (!on) return planLineText({ passesOn: false, planName: null });
    const clinics = await getMyClinics(userId);
    let picked: string | undefined;
    try {
      picked = (await cookies()).get(LOCATION_COOKIE)?.value;
    } catch {
      picked = undefined;
    }
    const current = clinics.find((c) => c.id === picked) ?? clinics[0];
    const db = supabaseAdmin();
    if (!current || !db) return planLineText({ passesOn: true, planName: null });
    const { data } = await db.from("location_passes").select("plan").eq("employer_id", current.id).in("status", ["active", "past_due"]).maybeSingle();
    return planLineText({ passesOn: true, planName: data ? (planByKey(data.plan as string)?.name ?? null) : null });
  } catch {
    return planLineText({ passesOn: false, planName: null });
  }
}
