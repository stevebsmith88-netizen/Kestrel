// Shows a small message at the bottom of the screen, without leaving the page (see components/ToastHost.tsx, which listens for it).
// A button that saves in place calls this when the server has answered. It is a window event, not part of any one button, so the
// message still appears when the button itself has gone (for example the job card of a job that was just deleted).
export type ToastTone = "ok" | "warn";
export const TOAST_EVENT = "kestrel-toast";

export function showToast(text: string, tone: ToastTone = "ok") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { text, tone } }));
}
