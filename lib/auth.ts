import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type Role = "candidate" | "clinic" | "admin";
export type Session = { userId: string; email: string; role: Role; firstName: string; fullName: string };

// Who is signed in. getUser asks Supabase to check the session, so this is the
// check to trust. Every protected page calls requireRole, never the proxy alone.
export const getSession = cache(async (): Promise<Session | null> => {
  const db = await supabaseServer();
  if (!db) return null;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  let { data: profile, error } = await db.from("profiles").select("role, full_name, first_name").eq("id", user.id).maybeSingle();
  // Until the names migration has been run, fall back to the columns that always exist.
  if (error) ({ data: profile } = await db.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle());
  const role: Role = profile?.role === "admin" || profile?.role === "clinic" ? profile.role : "candidate";
  const fullName: string = profile?.full_name ?? "";
  const firstName: string = profile?.first_name || fullName.split(" ")[0] || "";
  return { userId: user.id, email: user.email ?? "", role, firstName, fullName };
});

export const homeFor = (role: Role) => (role === "admin" ? "/admin" : role === "clinic" ? "/clinic" : "/candidate");

export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!roles.includes(session.role)) redirect(homeFor(session.role));
  return session;
}
