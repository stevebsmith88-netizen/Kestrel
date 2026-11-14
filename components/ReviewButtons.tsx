"use client";

import { useServerForm } from "@/components/useServerForm";
import { approveJobQuiet, rejectJobQuiet } from "@/lib/admin-actions";

// The two buttons under a job in the review queue. The result appears right under them and the page stays where it is, so the admin can
// follow what happened to this job without scrolling back to the top. Once a job is approved or sent back, both are switched off.
export default function ReviewButtons({ id }: { id: string }) {
  const approve = useServerForm(approveJobQuiet);
  const reject = useServerForm(rejectJobQuiet);
  const done = Boolean(approve.state.message || reject.state.message);
  const pending = approve.pending || reject.pending;
  return (
    <div className="reviewbtns">
      <form onSubmit={approve.submit} noValidate>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="btn" disabled={done || pending}>{approve.pending ? "Approving" : "Approve and publish"}</button>
      </form>
      <form onSubmit={reject.submit} noValidate className="rejectform">
        <input type="hidden" name="id" value={id} />
        <label className="lab" htmlFor={`note-${id}`}>Or send it back, and tell the clinic what to change</label>
        <textarea id={`note-${id}`} name="note" rows={3} disabled={done} />
        <button type="submit" className="btn ghost" disabled={done || pending}>{reject.pending ? "Sending" : "Send back"}</button>
      </form>
      <div aria-live="polite">
        {approve.state.error && <p className="err form-err" role="alert">{approve.state.error}</p>}
        {reject.state.error && <p className="err form-err" role="alert">{reject.state.error}</p>}
        {approve.state.message && <p className="ok-msg" role="status">{approve.state.message}</p>}
        {reject.state.message && <p className="ok-msg" role="status">{reject.state.message}</p>}
      </div>
    </div>
  );
}
