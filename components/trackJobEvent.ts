// Tells the server that a job was viewed or that Apply was pressed. Nothing is stored about the visitor, and a failure is ignored.
export function trackJobEvent(jobId: string, kind: "view" | "apply_click") {
  try {
    void fetch("/api/job-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job: jobId, kind }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {});
  } catch {
    // Counting must never get in the way of the page.
  }
}
