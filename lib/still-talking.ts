// The people a clinic is still talking to when it marks a role filled (audit P1-13, Steve's design of 12th November 2026). Everyone at
// Interview or Offer is listed on the "role filled" form with a kind message the clinic can edit, and is closed as Role filled and told,
// unless the clinic ticks "Don't close this one yet". Kept free of app imports so it can be tested (lib/still-talking.test.ts).

export const IN_TALKS = ["interview", "offer"] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX = 50;

export const stillTalkingMessage = (clinic: string) =>
  `Thank you for the time you gave us during the interview process at ${clinic}. We have now filled this role with another candidate. We were glad to meet you and wish you well.`;

// Reads the form: who to close, and the message for each. A message left empty, or with square brackets still in it, becomes the ready
// made one, so a slip never stops the whole form. The person named as hired is never in the list.
export function readStillTalking(form: FormData, clinic: string, hiredId: string | null): { id: string; message: string }[] {
  const ids = [...new Set(form.getAll("talkingIds").map(String).filter((x) => UUID.test(x)))].slice(0, MAX);
  return ids
    .filter((id) => id !== hiredId && form.get(`keepOpen_${id}`) !== "yes")
    .map((id) => {
      const typed = String(form.get(`talkMsg_${id}`) ?? "").replace(/\r\n/g, "\n").trim().slice(0, 1500);
      const usable = typed && !/\[[^\]]+\]/.test(typed);
      return { id, message: usable ? typed : stillTalkingMessage(clinic) };
    });
}
