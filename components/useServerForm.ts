"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { focusFirstProblem } from "@/components/focus-problem";
import type { JobFormState } from "@/lib/jobs";

type Action = (prev: JobFormState, form: FormData) => Promise<JobFormState>;

// Sends a form to a server action without React's automatic reset, so a mistake never
// clears what the person typed. It also passes along which button was pressed.
export const SEND_FAILED = "We couldn't send that just now. Your answers are still on this page, so please try again in a moment.";

export function useServerForm(action: Action) {
  // If sending fails (a dropped signal, a time out), show a message and keep what was typed, instead of an error page.
  const safe: Action = async (prev, form) => {
    try {
      return await action(prev, form);
    } catch (e) {
      // A redirect after a successful save is not a failure, so let it through.
      if (String((e as { digest?: unknown } | null)?.digest ?? "").startsWith("NEXT_REDIRECT")) throw e;
      return { ...prev, error: SEND_FAILED };
    }
  };
  const [state, run, pending] = useActionState(safe, {} as JobFormState);
  // After a send that comes back with a mistake, move keyboard focus to the first problem instead of leaving it behind.
  const formRef = useRef<HTMLFormElement | null>(null);
  const waiting = useRef(false);
  useEffect(() => {
    if (!waiting.current || pending) return;
    waiting.current = false;
    if (formRef.current && (state.error || (state.errors && Object.keys(state.errors).length))) focusFirstProblem(formRef.current);
  }, [state, pending]);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    formRef.current = e.currentTarget;
    waiting.current = true;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter instanceof HTMLElement ? submitter : undefined);
    startTransition(() => run(data));
  };
  // Send a form's data without a submit event (used when one form has two jobs).
  const send = (data: FormData) => startTransition(() => run(data));
  return { state, pending, submit, send };
}
