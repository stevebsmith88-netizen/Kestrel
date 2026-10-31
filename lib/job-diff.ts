// Compares the wording candidates were seeing with an edited version waiting in the review queue.
const FIELDS: [string, string][] = [
  ["title", "Title"],
  ["role_category", "Role"],
  ["employment_type", "Type"],
  ["province", "Province"],
  ["city", "City"],
  ["pay_period", "Pay period"],
  ["pay_min", "Pay minimum"],
  ["pay_max", "Pay maximum"],
  ["pay_extras", "Anything else that is part of the pay"],
  ["work_arrangement", "Work arrangement"],
  ["territory", "Area covered"],
  ["is_existing_vacancy", "Existing vacancy"],
  ["uses_ai_screening", "Uses AI to screen"],
  ["apply_method", "How to apply"],
  ["apply_url", "Application page"],
  ["description", "Ad text"],
];

export type Change = { label: string; before: string; after: string };

const show = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

// Numbers compare as numbers (62000 and "62000.00" are the same), and empty and missing are the same.
const same = (a: unknown, b: unknown) => {
  if ((a === null || a === undefined || a === "") && (b === null || b === undefined || b === "")) return true;
  if (typeof a === "number" || typeof b === "number") return Number(a) === Number(b);
  return a === b;
};

export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>): Change[] {
  return FIELDS.filter(([key]) => !same(before[key], after[key])).map(([key, label]) => ({ label, before: show(before[key]), after: show(after[key]) }));
}
