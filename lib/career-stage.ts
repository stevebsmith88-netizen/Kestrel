// "Where are you in eye care": an optional, private answer on the first step page (Steve, 12th November 2026). Plain facts about where someone is
// now, with no judgement and nothing that hints at age, family or health. It is never a gate, never shown to a clinic, and never used to rank
// or filter jobs. Whether a clinic may ever see it is for the lawyer to decide. Kept free of app imports so it can be tested on its own
// (lib/career-stage.test.ts).

export const CAREER_STAGES = [
  { value: "working", label: "Working in eye care now" },
  { value: "studying", label: "Studying or training for eye care" },
  { value: "not_yet", label: "Not working in eye care yet" },
] as const;

export type CareerStage = (typeof CAREER_STAGES)[number]["value"];

export function cleanStage(value: unknown): CareerStage | null {
  return CAREER_STAGES.find((s) => s.value === value)?.value ?? null;
}
