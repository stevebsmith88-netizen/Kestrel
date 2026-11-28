import "server-only";
import type { Session } from "@/lib/auth";
import { FOLLOW_LIMIT, FOLLOW_LIMIT_TEXT, FOLLOW_THANKS, type FollowState } from "@/lib/follows";
import { employerHref } from "@/lib/clinic-pages";
import { listPublicClinics } from "@/lib/public-clinics";
import { supabaseAdmin } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isEmployerId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

// Whether the signed in person follows 1 clinic or company. Only candidates can follow, so a clinic or admin gets "hidden" and no button.
export async function followState(session: Session | null, employerId: string): Promise<FollowState> {
  if (!session) return "signed-out";
  if (session.role !== "candidate") return "hidden";
  const admin = supabaseAdmin();
  if (!admin) return "not-following";
  const { data } = await admin.from("employer_follows").select("employer_id").eq("user_id", session.userId).eq("employer_id", employerId).maybeSingle();
  return data ? "following" : "not-following";
}

// Follows or unfollows. A candidate can follow only a clinic or company that has a public page, so nobody can use this to find out about an
// employer that is hidden. Nothing here tells the clinic who follows it.
export async function setFollow(session: Session, employerId: string, follow: boolean): Promise<{ state: FollowState; message?: string; error?: string }> {
  if (session.role !== "candidate") return { state: "hidden", error: "Only candidates can follow." };
  const admin = supabaseAdmin();
  if (!admin) return { state: "not-following", error: "We couldn't save that just now. Please try again." };
  if (!follow) {
    await admin.from("employer_follows").delete().eq("user_id", session.userId).eq("employer_id", employerId);
    return { state: "not-following" };
  }
  const { clinics } = await listPublicClinics();
  if (!clinics.some((c) => c.id === employerId)) return { state: "not-following", error: "That page is not available to follow." };
  const { count } = await admin.from("employer_follows").select("employer_id", { count: "exact", head: true }).eq("user_id", session.userId);
  if ((count ?? 0) >= FOLLOW_LIMIT) return { state: "not-following", error: FOLLOW_LIMIT_TEXT };
  const { error } = await admin.from("employer_follows").upsert({ user_id: session.userId, employer_id: employerId }, { onConflict: "user_id,employer_id", ignoreDuplicates: true });
  if (error) {
    console.error("Follow not saved:", error.code, error.message);
    return { state: "not-following", error: "We couldn't save that just now. Please try again." };
  }
  return { state: "following", message: FOLLOW_THANKS };
}

export type Followed = { employerId: string; name: string; place: string; href: string | null; since: string };

// The places a candidate follows, newest first, with the address of each public page.
export async function listFollows(userId: string): Promise<Followed[]> {
  const admin = supabaseAdmin();
  if (!admin) return [];
  const { data } = await admin.from("employer_follows").select("employer_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(FOLLOW_LIMIT);
  if (!data?.length) return [];
  const { clinics, slugs } = await listPublicClinics();
  return data.map((row) => {
    const c = clinics.find((x) => x.id === row.employer_id);
    const slug = c ? slugs.get(c.id) : null;
    return { employerId: row.employer_id as string, name: c?.clinic_name ?? "A clinic that is no longer listed", place: c ? [c.city, c.province].filter(Boolean).join(", ") : "", href: c && slug ? employerHref(slug, c.practice_type) : null, since: row.created_at as string };
  });
}
