// "Find your fit": a short, rules based quiz that points someone to the eye care roles that suit them.
// There is no AI and nothing is saved. Every rule is below, so it is easy to read and change.

import { CLINIC_ROLES, EMPLOYMENT_TYPES, FIELD_ROLES, PROVINCES, ROLE_CATEGORIES } from "./jobs.ts";

export type Answers = { work?: string; setting?: string; today?: string; employer?: string; hours?: string; province?: string };

type Option = { value: string; label: string };
export type Question = { id: keyof Answers; title: string; hint?: string; options: Option[]; select?: boolean };

const R = {
  optician: "Optician",
  assistant: "Optometric assistant or technician",
  optometrist: "Optometrist",
  manager: "Practice or clinic manager",
  reception: "Patient care or reception",
  sales: "Sales or territory representative",
  trainer: "Trainer or clinical educator",
  service: "Field service or equipment technician",
  accounts: "Account or practice development manager",
} as const;

export const QUESTIONS: Question[] = [
  {
    id: "work",
    title: "Which sounds most like the work you would enjoy?",
    hint: "Pick the closest one. There is no wrong answer.",
    options: [
      { value: "optician", label: "Helping people choose glasses, fitting them and getting the details right" },
      { value: "assistant", label: "Running pre-tests and helping the optometrist keep the day moving" },
      { value: "optometrist", label: "Examining eyes and making clinical decisions" },
      { value: "manager", label: "Keeping the clinic organised, the team supported and the numbers on track" },
      { value: "reception", label: "Being the friendly first face: welcoming, booking and looking after patients" },
      { value: "sales", label: "Visiting clinics, building relationships and selling products I believe in" },
      { value: "trainer", label: "Teaching people how to use a product or a piece of equipment" },
      { value: "service", label: "Installing, calibrating and fixing equipment" },
      { value: "accounts", label: "Growing accounts and helping practices get more from what they use" },
    ],
  },
  {
    id: "setting",
    title: "Where do you want to spend your week?",
    options: [
      { value: "on_site", label: "In one clinic or office most days" },
      { value: "field", label: "On the road, visiting clinics" },
      { value: "either", label: "A mix is fine" },
    ],
  },
  {
    id: "today",
    title: "Which describes you today?",
    options: [
      { value: "optometrist", label: "A registered optometrist" },
      { value: "optician", label: "A registered optician" },
      { value: "assistant", label: "An optometric assistant or technician" },
      { value: "managed", label: "Someone who has managed a clinic, a team or accounts" },
      { value: "new", label: "New to eye care, or moving from another field" },
    ],
  },
  {
    id: "employer",
    title: "What kind of employer appeals to you?",
    options: [
      { value: "independent", label: "An independent clinic, with a small team and varied days" },
      { value: "corporate", label: "A larger group, with structure and room to move up" },
      { value: "supplier", label: "A supplier or manufacturer" },
      { value: "any", label: "No preference" },
    ],
  },
  {
    id: "hours",
    title: "What hours are you looking for?",
    options: [...EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t })), { value: "any", label: "Open to any" }],
  },
  {
    id: "province",
    title: "Where in Canada?",
    select: true,
    options: [{ value: "any", label: "Anywhere in Canada" }, ...PROVINCES.map((p) => ({ value: p, label: p }))],
  },
];

// What each role is, in a sentence, for the results.
export const ROLE_BLURBS: Record<string, string> = {
  [R.optician]: "Fits and adjusts glasses, helps patients choose frames and lenses, and looks after the details of a prescription.",
  [R.assistant]: "Runs pre-tests, prepares patients for the optometrist and keeps the clinic day moving.",
  [R.optometrist]: "Examines eyes, diagnoses and manages eye conditions, and leads patient care.",
  [R.manager]: "Runs the clinic day to day: the team, the schedule, suppliers, insurance and the numbers.",
  [R.reception]: "Welcomes patients, books appointments and handles billing and questions at the front desk.",
  [R.sales]: "Travels to clinics in an area, shows lenses, frames, contact lenses or equipment, and looks after the accounts.",
  [R.trainer]: "Teaches clinic teams how to use products, lens designs or equipment, in person or online.",
  [R.service]: "Installs, calibrates and repairs equipment at clinics and labs.",
  [R.accounts]: "Works with larger accounts and helps practices plan, launch products and grow.",
};

const ORDER: string[] = Object.values(R);
const isField = (role: string) => (FIELD_ROLES as readonly string[]).includes(role);
const isClinic = (role: string) => (CLINIC_ROLES as readonly string[]).includes(role);

export type Match = { role: string; score: number; reasons: string[] };

// Scores every role from the answers, best first. The same answers always give the same result.
export function scoreRoles(a: Answers): Match[] {
  const scores = new Map<string, { score: number; reasons: string[] }>(ORDER.map((r) => [r, { score: 0, reasons: [] }]));
  const add = (role: string, points: number, reason: string) => {
    const entry = scores.get(role);
    if (!entry) return;
    entry.score += points;
    if (reason && !entry.reasons.includes(reason)) entry.reasons.push(reason);
  };

  const liked = a.work ? R[a.work as keyof typeof R] : undefined;
  if (liked) add(liked, 4, "It is the kind of work you said you would enjoy");

  if (a.setting === "field") ORDER.filter(isField).forEach((r) => add(r, 2, "You want to be on the road"));
  if (a.setting === "on_site") ORDER.filter(isClinic).forEach((r) => add(r, 2, "You want to be based in one place"));

  switch (a.today) {
    case "optometrist":
      add(R.optometrist, 4, "You are a registered optometrist");
      add(R.trainer, 1, "Clinical knowledge is valued in training");
      break;
    case "optician":
      add(R.optician, 4, "You are a registered optician");
      add(R.sales, 2, "Opticians know what clinics need from a supplier");
      add(R.trainer, 2, "Opticians are often good teachers of products");
      add(R.accounts, 1, "");
      break;
    case "assistant":
      add(R.assistant, 4, "You already work as an assistant or technician");
      add(R.optician, 1, "A natural next step");
      add(R.trainer, 1, "");
      add(R.service, 1, "Technical skills carry over");
      break;
    case "managed":
      add(R.manager, 3, "You have managed a clinic, a team or accounts");
      add(R.accounts, 2, "Managing accounts and teams carries over");
      add(R.sales, 1, "");
      break;
    case "new":
      add(R.reception, 3, "A welcoming way into eye care");
      add(R.assistant, 2, "Many assistants learn on the job");
      break;
  }

  if (a.employer === "supplier") ORDER.filter(isField).forEach((r) => add(r, 1, "You like the idea of a supplier or manufacturer"));
  if (a.employer === "independent" || a.employer === "corporate") ORDER.filter(isClinic).forEach((r) => add(r, 1, ""));

  return [...scores.entries()]
    .map(([role, v]) => ({ role, ...v }))
    .sort((x, y) => y.score - x.score || ORDER.indexOf(x.role) - ORDER.indexOf(y.role));
}

// The best few roles. Roles that scored nothing are left out, and there is always at least one.
export function topMatches(a: Answers, max = 3): Match[] {
  const ranked = scoreRoles(a);
  const best = ranked[0]?.score ?? 0;
  const kept = ranked.filter((m) => m.score > 0 && m.score >= best - 4).slice(0, max);
  return kept.length ? kept : ranked.slice(0, 1);
}

// A link to the job search with the filters that fit. The employer type is only used where it makes sense
// (suppliers hire field roles, clinics hire clinic roles), so a search never comes back empty by mistake.
export function searchLink(role: string, a: Answers) {
  const params = new URLSearchParams();
  if ((ROLE_CATEGORIES as readonly string[]).includes(role)) params.set("role", role);
  if (a.province && a.province !== "any" && (PROVINCES as readonly string[]).includes(a.province)) params.set("province", a.province);
  if (a.hours && (EMPLOYMENT_TYPES as readonly string[]).includes(a.hours)) params.set("type", a.hours);
  if (a.employer === "supplier" && isField(role)) params.set("practice", "supplier");
  if ((a.employer === "independent" || a.employer === "corporate") && isClinic(role)) params.set("practice", a.employer);
  if (a.setting === "field" && isField(role)) params.set("arrangement", "field");
  return `/jobs?${params.toString()}`;
}
