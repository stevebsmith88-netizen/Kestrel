// The details that go to a clinic with an application. applyToJob saves exactly this, and the apply page lists exactly this, so the
// screen where the person presses Send can never show less than what is sent. Kept free of app imports so it can be tested on its
// own (lib/application-details.test.ts).

export type ProfileForApplication = {
  profession?: string | null;
  phone?: string | null;
  licensed_provinces?: string[] | null;
  years_experience?: string | null;
  available_from?: string | null;
  cv_filename?: string | null;
};

export type Applicant = {
  name: string;
  email: string;
  phone: string | null;
  profession: string | null;
  licensed_provinces: string[] | null;
  years_experience: string | null;
  available_from: string | null;
};

export function applicantSnapshot(who: { name: string; email: string }, p: ProfileForApplication): Applicant {
  return {
    name: who.name,
    email: who.email,
    phone: p.phone ?? null,
    profession: p.profession ?? null,
    licensed_provinces: p.licensed_provinces ?? null,
    years_experience: p.years_experience ?? null,
    available_from: p.available_from ?? null,
  };
}

export const NOT_GIVEN = "Not given";

// Every detail the clinic receives, in the order the apply page shows them. The resume file goes with the application too.
export function sentDetails(a: Applicant, resumeFilename: string | null | undefined, formatDate: (iso: string) => string): { label: string; value: string }[] {
  return [
    { label: "Name", value: a.name || NOT_GIVEN },
    { label: "Email", value: a.email || NOT_GIVEN },
    { label: "Phone", value: a.phone?.trim() || NOT_GIVEN },
    { label: "Role", value: a.profession || NOT_GIVEN },
    { label: "Registered in", value: a.licensed_provinces?.length ? a.licensed_provinces.join(", ") : NOT_GIVEN },
    { label: "Years of experience", value: a.years_experience || NOT_GIVEN },
    { label: "Available from", value: a.available_from ? formatDate(a.available_from) : NOT_GIVEN },
    { label: "Resume", value: resumeFilename || NOT_GIVEN },
  ];
}
