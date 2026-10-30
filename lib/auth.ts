import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";

export type Role = "candidate" | "clinic" | "admin";
export type Session = { userId: string; email: string; role: Role; firstName: string; fullName: string; needsAccountType: boolean; hasPassword: boolean };

// Safety net: if someone is signed in but has no profile (the sign up trigger did not
// run), make one from their sign up details. It can only ever be a candidate or a
// clinic, never an admin.
async function ensureProfile(user: User) {
  const admin = supabaseAdmin();
  if (!admin) return null;
  const meta = user.user_metadata ?? {};
  const fullName = String(meta.full_name ?? "").slice(0, 120);
  const firstName = String(meta.first_name ?? fullName.split(" ")[0] ?? "").slice(0, 60);
  const lastName = String(meta.last_name ?? fullName.split(" ").slice(1).join(" ")).slice(0, 60);
  const row = {
    id: user.id,
    role: meta.role === "clinic" ? "clinic" : "candidate",
    first_name: firstName,
    last_name: lastName,
    full_name: fullName || `${firstName} ${lastName}`.trim(),
  };
  const { data } = await admin.from("profiles").upsert(row, { onConflict: "id", ignoreDuplicates: true }).select("role, full_name, first_name").maybeSingle();
  return data ? { ...data, account_type_confirmed: true } : null;
}

// Who is signed in. getUser asks Supabase to check the session, so this is the
// check to trust. Every protected page calls requireRole, never the proxy alone.
export const getSession = cache(async (): Promise<Session | null> => {
  const db = await supabaseServer();
  if (!db) return null;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  let { data: profile, error } = await db.from("profiles").select("role, full_name, first_name, account_type_confirmed").eq("id", user.id).maybeSingle();
  // Until the names migration has been run, fall back to the columns that always exist.
  if (error) ({ data: profile } = await db.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle());
  const needsAccountType = (profile as { account_type_confirmed?: boolean } | null)?.account_type_confirmed === false;
  if (!profile) profile = await ensureProfile(user);
  const role: Role = profile?.role === "admin" || profile?.role === "clinic" ? profile.role : "candidate";
  const fullName: string = profile?.full_name ?? "";
  const firstName: string = profile?.first_name || fullName.split(" ")[0] || "";
  // Someone who only ever signed in with Google has no Kestrel password.
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [user.app_metadata?.provider as string | undefined].filter(Boolean);
  const hasPassword = providers.includes("email");
  return { userId: user.id, email: user.email ?? "", role, firstName, fullName, needsAccountType, hasPassword };
});

export const homeFor = (role: Role) => (role === "admin" ? "/admin" : role === "clinic" ? "/clinic" : "/candidate");

export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  // Someone who signed up with Google has not yet said whether they are a candidate or a clinic.
  if (session.needsAccountType) redirect("/welcome");
  if (!roles.includes(session.role)) redirect(homeFor(session.role));
  return session;
}
