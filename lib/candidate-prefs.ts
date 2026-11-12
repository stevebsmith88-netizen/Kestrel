// What a candidate says they are looking for: checking the profile form's answers, and turning a saved profile into the rules' input.
// Kept free of app imports so it can be tested on its own (lib/candidate-prefs.test.ts).

import { EMPLOYMENT_TYPES, FIELD_ROLES, PAY_PERIODS, PROVINCES, ROLE_CATEGORIES, parseMoney } from "./jobs.ts";
import { canHaveFieldRoles, neverTogether } from "./role-fit.ts";
import { SOFTWARE_TAGS, cleanTags } from "./job-tags.ts";
import { RADIUS_OPTIONS, findPlace } from "./places.ts";
import type { Prefs } from "./recommend.ts";

export type PrefsAnswers = {
  homeCity?: string;
  homeProvince?: string;
  radius?: string;
  extraProvinces?: string[];
  employmentTypes?: string[];
  otherRoles?: string[];
  openToField?: boolean; // the single tick that adds every field and supplier role
  minPay?: string;
  payPeriod?: string;
  practice?: string;
  softwareSkills?: string[];
};

// The database columns, ready to save.
export type PrefsRow = {
  home_city: string | null;
  home_province: string | null;
  pref_radius_km: number;
  pref_provinces: string[];
  pref_employment_types: string[];
  pref_other_roles: string[];
  pref_min_pay: number | null;
  pref_pay_period: "hour" | "year" | null;
  pref_practice: "independent" | "corporate" | null;
  software_skills: string[];
};

const only = (values: string[] | undefined, allowed: readonly string[]) => [...new Set((values ?? []).filter((v) => allowed.includes(v)))];

export function cleanPrefs(raw: PrefsAnswers, profession: string): { row: PrefsRow; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const city = (raw.homeCity ?? "").trim().slice(0, 80);
  const province = (raw.homeProvince ?? "").trim();
  let homeCity: string | null = null;
  let homeProvince: string | null = null;
  if (city) {
    if (!(PROVINCES as readonly string[]).includes(province)) errors.homeProvince = "Choose the province for your town.";
    else {
      const place = findPlace(city, province);
      if (!place) errors.homeCity = "We do not have that town on our list. Try the nearest larger town.";
      else {
        homeCity = place.name;
        homeProvince = place.province;
      }
    }
  }

  const radius = RADIUS_OPTIONS.find((r) => String(r) === (raw.radius ?? "")) ?? 25;

  const amount = (raw.minPay ?? "").trim();
  let minPay: number | null = null;
  let payPeriod: "hour" | "year" | null = null;
  if (amount) {
    minPay = parseMoney(amount);
    payPeriod = PAY_PERIODS.find((p) => p.value === raw.payPeriod)?.value ?? null;
    if (minPay === null || minPay <= 0) errors.minPay = "Enter an amount, for example 28.50 or 62,000.";
    else if (!payPeriod) errors.payPeriod = "Choose whether that is a year or an hour.";
  }

  const practice = raw.practice === "independent" || raw.practice === "corporate" ? raw.practice : null;
  const fieldNames = FIELD_ROLES as readonly string[];
  // Field and supplier roles come only from the tick, and never for an optometrist. An optician and an optometrist never see each other's jobs.
  const chosen = only(raw.otherRoles, ROLE_CATEGORIES).filter((r) => r !== profession && !neverTogether(profession, r) && !fieldNames.includes(r));
  const otherRoles = raw.openToField && canHaveFieldRoles(profession) ? [...chosen, ...FIELD_ROLES] : chosen;

  return {
    errors,
    row: {
      home_city: homeCity,
      home_province: homeProvince,
      pref_radius_km: radius,
      pref_provinces: only(raw.extraProvinces, PROVINCES),
      pref_employment_types: only(raw.employmentTypes, EMPLOYMENT_TYPES),
      pref_other_roles: otherRoles,
      pref_min_pay: errors.minPay || errors.payPeriod ? null : minPay,
      pref_pay_period: errors.minPay || errors.payPeriod ? null : payPeriod,
      pref_practice: practice,
      software_skills: cleanTags(raw.softwareSkills ?? [], SOFTWARE_TAGS),
    },
  };
}

// The saved profile (database columns) as the rules' input.
export type PrefsSource = Partial<PrefsRow> & { profession: string | null; licensed_provinces: string[] };

export function prefsFromProfile(p: PrefsSource | null): Prefs {
  return {
    profession: p?.profession ?? null,
    otherRoles: p?.pref_other_roles ?? [],
    licensedProvinces: p?.licensed_provinces ?? [],
    homeCity: p?.home_city ?? null,
    homeProvince: p?.home_province ?? null,
    radiusKm: p?.pref_radius_km ?? 25,
    extraProvinces: p?.pref_provinces ?? [],
    employmentTypes: p?.pref_employment_types ?? [],
    minPay: p?.pref_min_pay === null || p?.pref_min_pay === undefined ? null : Number(p.pref_min_pay),
    payPeriod: p?.pref_pay_period ?? null,
    practice: p?.pref_practice ?? null,
    software: p?.software_skills ?? [],
  };
}
