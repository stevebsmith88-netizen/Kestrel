"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ACCOUNT_TYPES, MARKETING_CONSENT_TEXT, MIN_PASSWORD, NOT_CONNECTED, isEmail, type FormState } from "@/lib/auth-copy";

const text = (form: FormData, key: string, max = 200) => String(form.get(key) ?? "").trim().slice(0, max);

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 254).toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!isEmail(email) || !password) return { error: "Enter your email and password." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "Please confirm your email first. We sent you a link when you signed up." };
    return { error: "That email and password don't match. Please try again." };
  }
  redirect("/dashboard");
}

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const accountType = text(form, "accountType", 20);
  const firstName = text(form, "firstName", 60);
  const lastName = text(form, "lastName", 60);
  const email = text(form, "email", 254).toLowerCase();
  const password = String(form.get("password") ?? "");
  const agree = form.get("agree") === "on";
  const marketing = form.get("marketing") === "on";

  if (!ACCOUNT_TYPES.some((a) => a.value === accountType)) return { error: "Choose whether you are looking for a job or hiring." };
  if (!firstName) return { error: "Enter your first name." };
  if (!lastName) return { error: "Enter your last name." };
  if (!isEmail(email)) return { error: "Enter an email address like example@mysite.com." };
  if (password.length < MIN_PASSWORD) return { error: `Your password needs at least ${MIN_PASSWORD} characters.` };
  if (!agree) return { error: "Please agree to the privacy policy to continue." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };

  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: accountType,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        marketing_consent: marketing,
        marketing_consent_text: marketing ? MARKETING_CONSENT_TEXT : null,
      },
    },
  });
  if (error) {
    console.error("Sign up failed:", error.code, error.message);
    if (error.code === "over_email_send_rate_limit") return { error: "We have sent a lot of emails just now. Please wait a few minutes and try again." };
    if (error.code === "weak_password") return { error: "That password is too easy to guess. Please choose a stronger one." };
    return { error: "We couldn't create your account. Please try again." };
  }
  if (data.session) redirect("/dashboard");
  return { message: "We have sent a link to your email. Open it to confirm your address, then sign in.", email };
}

export async function forgotPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email", 254).toLowerCase();
  if (!isEmail(email)) return { error: "Enter an email address like example@mysite.com." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };

  const { error } = await db.auth.resetPasswordForEmail(email);
  if (error) console.error("Password reset failed:", error.code, error.message);
  // Same answer whether or not the address has an account, so nobody can use this to check.
  return { message: "If there is an account for that email, we have sent a link to reset your password." };
}

export async function resetPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  const again = String(form.get("again") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `Your password needs at least ${MIN_PASSWORD} characters.` };
  if (password !== again) return { error: "The two passwords don't match." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "This link has expired. Please ask for a new one." };

  const { error } = await db.auth.updateUser({ password });
  if (error) {
    if (error.code === "weak_password") return { error: "That password is too easy to guess. Please choose a stronger one." };
    if (error.code === "same_password") return { error: "Please choose a password you haven't used before." };
    return { error: "We couldn't change your password. Please try again." };
  }
  redirect("/dashboard");
}

export async function signOut() {
  const db = await supabaseServer();
  await db?.auth.signOut();
  redirect("/");
}
