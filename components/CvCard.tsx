"use client";

import { useServerForm } from "@/components/useServerForm";
import { deleteCv, uploadCv } from "@/lib/candidate-actions";

export default function CvCard({ filename, uploadedOn }: { filename: string | null; uploadedOn: string | null }) {
  const { state, pending, submit } = useServerForm(uploadCv);
  return (
    <section className="card" aria-labelledby="cv-h">
      <h2 id="cv-h">Your CV</h2>
      {filename ? (
        <div className="file">
          <span className="ft" aria-hidden="true">CV</span>
          <div className="filemain">
            <strong>{filename}</strong>
            {uploadedOn && <div className="meta">Uploaded {uploadedOn}</div>}
          </div>
          <a className="btn sm ghost" href="/candidate/cv">Download</a>
          <form action={deleteCv}><button type="submit" className="linkbtn">Delete</button></form>
        </div>
      ) : (
        <p className="help">No CV saved yet. Upload one and you can apply to any job in a few clicks.</p>
      )}

      <form onSubmit={submit} noValidate className="uploadform">
        <label className="lab" htmlFor="cv-file">{filename ? "Replace your CV" : "Upload your CV"}</label>
        <input id="cv-file" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
        <p className="help">PDF or Word, up to 3 MB.</p>
        {state.error && <p className="err form-err" role="alert">{state.error}</p>}
        {state.message && <p className="ok-msg" role="status">{state.message}</p>}
        <button type="submit" className="btn sm" disabled={pending}>{pending ? "Uploading" : "Upload"}</button>
      </form>
      <p className="help">Stored privately in Canada. Only a clinic you apply to can open it, through a link that works for one minute. You can delete it at any time.</p>
    </section>
  );
}
