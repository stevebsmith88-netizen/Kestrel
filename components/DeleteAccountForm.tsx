"use client";

import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { deleteAccount } from "@/lib/account-actions";

export default function DeleteAccountForm({ role, hasPassword = true, email = "" }: { role: "candidate" | "clinic"; hasPassword?: boolean; email?: string }) {
  const { state, pending, submit } = useServerForm(deleteAccount);
  const e = state.errors ?? {};
  return (
    <form onSubmit={submit} noValidate className="dangerzone">
      <h2>Delete my account</h2>
      <p>
        This permanently deletes your account{role === "candidate" ? ", your profile, your saved CV and every application you have sent" : ", your clinic profile, your jobs, and every application you have received"}. It can&apos;t be undone.
      </p>
      {hasPassword ? (
        <Field id="da-password" label="Your password" required error={e.password}>
          <input id="da-password" name="password" type="password" autoComplete="current-password" />
        </Field>
      ) : (
        <Field id="da-email" label="Type your email address" required error={e.confirmEmail} hint={`You sign in with Google, so there is no password. Type ${email} to confirm it is you.`}>
          <input id="da-email" name="confirmEmail" type="email" autoComplete="off" />
        </Field>
      )}
      <Field id="da-confirm" label="Type DELETE to confirm" required error={e.confirm}>
        <input id="da-confirm" name="confirm" type="text" autoComplete="off" />
      </Field>
      {state.error && !state.errors && <p className="err form-err" role="alert">{state.error}</p>}
      <button type="submit" className="btn danger" disabled={pending}>{pending ? "Deleting" : "Delete my account for good"}</button>
    </form>
  );
}
