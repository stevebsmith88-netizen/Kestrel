"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { showToast } from "@/components/toast";
import { DASHBOARD_NOTICES, noticeTone, type QuickState } from "@/lib/dashboard-notices";

type QuickAction = (prev: QuickState, form: FormData) => Promise<QuickState>;

function Submit({ className, label, children }: { className: string; label?: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending} aria-label={label}>
      {children}
    </button>
  );
}

// A dashboard button that saves without leaving the page. The server does the work and refreshes the dashboard where it stands (so
// nothing jumps to the top), then a small message appears in view. If the server cannot be reached, the message says so and
// nothing is lost. `ids` are sent as the "id" field (more than one for "Clear all").
export default function QuickActionForm({ action, ids, className, label, children }: { action: QuickAction; ids: string[]; className: string; label?: string; children: ReactNode }) {
  const [, run] = useActionState(async (prev: QuickState, form: FormData): Promise<QuickState> => {
    try {
      const result = await action(prev, form);
      const text = result?.text ?? (result?.notice ? DASHBOARD_NOTICES[result.notice] : "");
      if (text && result) showToast(text, result.tone ?? noticeTone(result.notice));
      return result;
    } catch (e) {
      // A redirect (for example to sign in again) is not a failure, so let it through.
      if (String((e as { digest?: unknown } | null)?.digest ?? "").startsWith("NEXT_REDIRECT")) throw e;
      showToast("We couldn't do that just now. Please try again in a moment.", "warn");
      return null;
    }
  }, null);

  return (
    <form action={run}>
      {ids.map((id) => <input type="hidden" name="id" value={id} key={id} />)}
      <Submit className={className} label={label}>{children}</Submit>
    </form>
  );
}
