// The details that go to a clinic with an application. applyToJob saves exactly this, and the apply page lists exactly this, so the
// screen where the person presses Send can never show less than what is sent. Kept free of app imports so it can be tested on its
// own (lib/application-details.test.ts).
import { DOES, doesSummary, licenceRole, licenceSummary, type Does, type Licence } from "./licence.ts";

export type ProfileForApplication = {
  profession?: string | null;
  phone?: string | null;
  licensed_provinces?: string[] | null;
  years_experience?: string | null;
  available_from?: string | null;
  cv_filename?: string | null;
  linkedin_url?: string | null; // optional (migration 0054)
  licence_province?: string | null; // optional (migration 0056)
  licence_number?: string | null;
  licence_does?: string[] | null;
  licence_not_yet?: boolean | null;
};

export type Applicant = {
  name: string;
  email: string;
  phone: string | null;
  profession: string | null;
  licensed_provinces: string[] | null;
  years_experience: string | null;
  available_from: string | null;
  linkedin_url: string | null;
  licence?: Licence | null; // an optometrist or optician's registration number as the candidate entered it, never checked by Kestrel
};

// The registration number goes with an application only from an optometrist or optician who has given one (or said they are not registered yet).
function licenceFrom(p: ProfileForApplication): Licence | null {
  if (!licenceRole(p.profession)) return null;
  if (!p.licence_number && !p.licence_not_yet) return null;
  const does = (p.licence_does ?? []).filter((d): d is Does => (DOES as readonly string[]).includes(d));
  return { province: p.licence_province ?? null, number: p.licence_number ?? null, does, notYet: Boolean(p.licence_not_yet) };
}

export function applicantSnapshot(who: { name: string; email: string }, p: ProfileForApplication): Applicant {
  const licence = licenceFrom(p);
  return {
    name: who.name,
    email: who.email,
    phone: p.phone ?? null,
    profession: p.profession ?? null,
    licensed_provinces: p.licensed_provinces ?? null,
    years_experience: p.years_experience ?? null,
    available_from: p.available_from ?? null,
    linkedin_url: p.linkedin_url ?? null,
    ...(licence ? { licence } : {}),
  };
}

export const NOT_GIVEN = "Not given";

// Every detail the clinic receives, in the order the apply page shows them. The resume file goes with the application too.
export function sentDetails(a: Applicant, resumeFilename: string | null | undefined, formatDate: (iso: string) => string): { label: string; value: string }[] {
  const asked = licenceRole(a.profession);
  return [
    { label: "Name", value: a.name || NOT_GIVEN },
    { label: "Email", value: a.email || NOT_GIVEN },
    { label: "Phone", value: a.phone?.trim() || NOT_GIVEN },
    { label: "Role", value: a.profession || NOT_GIVEN },
    { label: "Registered in", value: a.licensed_provinces?.length ? a.licensed_provinces.join(", ") : NOT_GIVEN },
    ...(asked ? [{ label: "Registration number", value: licenceSummary(a.profession, a.licence) }] : []),
    ...(asked === "Optician" && a.licence?.does.length ? [{ label: "Registered for", value: doesSummary(a.licence) }] : []),
    { label: "Years of experience", value: a.years_experience || NOT_GIVEN },
    { label: "Available from", value: a.available_from ? formatDate(a.available_from) : NOT_GIVEN },
    { label: "LinkedIn", value: a.linkedin_url?.trim() || NOT_GIVEN },
    { label: "Resume", value: resumeFilename || NOT_GIVEN },
  ];
}
