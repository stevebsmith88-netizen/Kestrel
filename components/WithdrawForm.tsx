"use client";

import { useRef, useState } from "react";
import { withdrawApplication } from "@/lib/candidate-actions";

// Withdraw with 1 confirming step (Steve, 13th November 2026): a withdrawn application cannot be sent again for the same job, so a stray tap
// should not end it. The first button asks; the second sends.
export default function WithdrawForm({ id, clinicName }: { id: string; clinicName: string }) {
  const [asking, setAsking] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  return (
    <form action={withdrawApplication}>
      <input type="hidden" name="id" value={id} />
      {!asking ? (
        <button type="button" className="btn ghost" onClick={() => { setAsking(true); setTimeout(() => confirmRef.current?.focus(), 0); }}>Withdraw my application</button>
      ) : (
        <div className="note" role="alert">
          <p><strong>Withdraw your application to {clinicName}?</strong> You can&apos;t apply to this job again. We will let the clinic know.</p>
          <div className="formbtns">
            <button ref={confirmRef} type="submit" className="btn">Yes, withdraw it</button>
            <button type="button" className="btn ghost" onClick={() => setAsking(false)}>Keep my application</button>
          </div>
        </div>
      )}
    </form>
  );
}
