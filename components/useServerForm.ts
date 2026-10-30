"use client";

import { startTransition, useActionState } from "react";
import type { JobFormState } from "@/lib/jobs";

type Action = (prev: JobFormState, form: FormData) => Promise<JobFormState>;

// Sends a form to a server action without React's automatic reset, so a mistake never
// clears what the person typed. It also passes along which button was pressed.
export function useServerForm(action: Action) {
  const [state, run, pending] = useActionState(action, {} as JobFormState);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter instanceof HTMLElement ? submitter : undefined);
    startTransition(() => run(data));
  };
  // Send a form's data without a submit event (used when one form has two jobs).
  const send = (data: FormData) => startTransition(() => run(data));
  return { state, pending, submit, send };
}
