// Compares the wording candidates were seeing with an edited version waiting in the review queue.
const FIELDS: [string, string][] = [
  ["title", "Title"],
  ["role_category", "Role"],
  ["employment_type", "Type"],
  ["province", "Province"],
  ["city", "City"],
  ["pay_period", "Pay period"],
  ["pay_is_minimum", "Dollars are a guaranteed minimum"],
  ["pay_days_per_week", "Days a week (daily rate)"],
  ["pay_min", "Pay minimum"],
  ["pay_max", "Pay maximum"],
  ["pay_percent_min", "Percentage, lowest"],
  ["pay_percent_max", "Percentage, highest"],
  ["pay_percent_of", "Percentage is of"],
  ["pay_expected_min", "Expected earnings, lowest"],
  ["pay_expected_max", "Expected earnings, highest"],
  ["pay_expected_period", "Expected earnings per"],
  ["tags_software", "Practice software"],
  ["tags_equipment", "Diagnostic equipment"],
  ["tags_specialties", "Specialties"],
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
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return "(empty)";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

// Numbers compare as numbers (62000 and "62000.00" are the same), and empty and missing are the same.
const empty = (v: unknown) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
const same = (a: unknown, b: unknown) => {
  if (empty(a) && empty(b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => x === b[i]);
  if (typeof a === "number" || typeof b === "number") return Number(a) === Number(b);
  return a === b;
};

export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>): Change[] {
  // A copy kept before the daily minimum flag existed has no value for it, which means "not a daily minimum".
  const flag = (row: Record<string, unknown>, key: string) => (key === "pay_is_minimum" ? row[key] === true : row[key]);
  return FIELDS.filter(([key]) => !same(flag(before, key), flag(after, key))).map(([key, label]) => ({ label, before: show(flag(before, key)), after: show(flag(after, key)) }));
}
