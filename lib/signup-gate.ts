import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

// Sign up is closed until launch. The gate itself lives in the database (migration 0021), so it cannot be skipped by calling the
// sign up service directly. If the gate cannot be read, sign up counts as closed, which is the safe way to fail.
// To open sign up at launch, run in the Supabase SQL editor:  update public.signup_gate set open = true;
export async function signupsOpen() {
  const db = supabaseAdmin();
  if (!db) return false;
  const { data, error } = await db.from("signup_gate").select("open").maybeSingle();
  if (error) {
    console.error("Sign up gate could not be read, treating sign up as closed:", error.code, error.message);
    return false;
  }
  return data?.open === true;
}

// A one time ticket that lets 1 invited person create an account while the gate is closed. Lasts 15 minutes.
export async function issueSignupTicket(): Promise<string | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data, error } = await db.rpc("issue_signup_ticket");
  if (error || typeof data !== "string") {
    console.error("Sign up ticket could not be issued:", error?.code, error?.message);
    return null;
  }
  return data;
}
