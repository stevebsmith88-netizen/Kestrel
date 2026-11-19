// Registration numbers for optometrists and opticians (Steve, 19th November 2026; research and screenshots in docs/plans/licence-numbers.md).
// A candidate can give the number their college issued them. It is entered by the candidate and is not checked by Kestrel, which never
// looks a number up in a college register (no automated collection from provincial college registers). A clinic that gets an application
// sees the number with a button that opens the right register, so the clinic can check it by hand. Kept free of app imports so it can be
// tested on its own (lib/licence.test.ts).

export type LicenceRole = "Optometrist" | "Optician";
export const licenceRole = (profession: string | null | undefined): LicenceRole | null => (profession === "Optometrist" || profession === "Optician" ? profession : null);

// How a register can be used, from what was seen:
//   number  the register can be searched by registration number (Ontario, BC)
//   name    the register is searched by name, then the person's page is compared with the number given (Alberta, Manitoba, Saskatchewan optometrists)
//   college we have the regulator's website but have not seen a register, so the clinic is sent to the college (everything else)
export type RegisterKind = "number" | "name" | "college";
// `nameParam` is the web address part some registers use to search by name from a link (New Brunswick: ?_search_by_name=Smith), so the button can open
// the register already searched for the candidate's surname. Only registers seen to do this have it.
export type Register = { college: string; url: string | null; kind: RegisterKind; numberShown: "full" | "masked" | "unknown"; nameParam?: string; noOnlineRegister?: boolean; noStatus?: boolean; directoryOnly?: boolean };

const CHCPBC = "https://chcpbc.alinityapp.com/client/publicdirectory";

const OPTOMETRIST: Record<string, Register> = {
  "Alberta": { college: "Alberta College of Optometrists", url: "https://aco.alinityapp.com/client/publicdirectory", kind: "number", numberShown: "full" },
  "British Columbia": { college: "College of Health and Care Professionals of BC", url: CHCPBC, kind: "number", numberShown: "masked" },
  "Manitoba": { college: "Manitoba Association of Optometrists", url: "https://optometrists.mb.ca/about/find-optometrist", kind: "name", numberShown: "unknown", nameParam: "name", directoryOnly: true },
  "New Brunswick": { college: "New Brunswick Association of Optometrists", url: "https://www.nbao.ca/en/find-an-optometrist", kind: "name", numberShown: "unknown", noStatus: true },
  "Newfoundland and Labrador": { college: "Newfoundland and Labrador College of Optometrists", url: "https://nlco.ca/", kind: "college", numberShown: "unknown" },
  "Nova Scotia": { college: "Nova Scotia College of Optometrists", url: "https://nsco.ca/site/findanoptometrist", kind: "name", numberShown: "full", noStatus: true },
  "Ontario": { college: "College of Optometrists of Ontario", url: "https://members.collegeoptom.on.ca/COO/PublicDirectory/Public_Directory_Member/Public_Register/PublicRegisterMember.aspx", kind: "number", numberShown: "full" },
  "Prince Edward Island": { college: "PEI College of Optometrists", url: "https://peico.ca/", kind: "college", numberShown: "unknown" },
  "Quebec": { college: "Ordre des optométristes du Québec", url: "https://www.ooq.org/", kind: "college", numberShown: "unknown" },
  "Saskatchewan": { college: "Saskatchewan Association of Optometrists", url: "https://optometrists.sk.ca/about/find-a-member/", kind: "name", numberShown: "unknown", directoryOnly: true },
  "Yukon": { college: "Yukon professional licensing", url: "https://yukon.ca/en/doing-business/professional-licensing", kind: "college", numberShown: "unknown" },
  "Northwest Territories": { college: "NWT Department of Health and Social Services, professional licensing", url: "https://www.hss.gov.nt.ca/en/services/professional-licensing", kind: "college", numberShown: "unknown" },
  "Nunavut": { college: "Nunavut Department of Health", url: "https://www.gov.nu.ca/en/health/health-professionals", kind: "college", numberShown: "unknown" },
};

// Opticians are not regulated in Yukon, the Northwest Territories or Nunavut, so they are not listed here, and nobody is asked for a number there.
const OPTICIAN: Record<string, Register> = {
  "Alberta": { college: "College of Opticians of Alberta", url: "https://coa.alinityapp.com/Client/PublicDirectory", kind: "name", numberShown: "full" },
  "British Columbia": { college: "College of Health and Care Professionals of BC", url: CHCPBC, kind: "number", numberShown: "masked" },
  "Manitoba": { college: "The Opticians of Manitoba", url: "https://www.opticianry.ca/oom/MemberRoster.aspx", kind: "name", numberShown: "unknown" },
  "New Brunswick": { college: "Opticians Association of New Brunswick", url: "https://opticiansnb.com/find-optician/", kind: "name", numberShown: "full", nameParam: "_search_by_name" },
  "Newfoundland and Labrador": { college: "Dispensing Opticians Board of Newfoundland and Labrador", url: "https://opticiansnl.ca/", kind: "college", numberShown: "unknown", noOnlineRegister: true },
  "Nova Scotia": { college: "Nova Scotia College of Dispensing Opticians", url: "https://nscdo.ca/optician-directory", kind: "name", numberShown: "full" },
  "Ontario": { college: "College of Opticians of Ontario", url: "https://members.collegeofopticians.ca/Public-Register", kind: "number", numberShown: "full" },
  "Prince Edward Island": { college: "College of Opticians of Prince Edward Island", url: null, kind: "college", numberShown: "unknown" },
  "Quebec": { college: "Ordre des opticiens d'ordonnances du Québec", url: "https://opticien.qc.ca/", kind: "college", numberShown: "unknown" },
  "Saskatchewan": { college: "Saskatchewan College of Opticians", url: "https://www.opticianry.ca/MemberRoster/MemberRoster.aspx?OrgID=SCO", kind: "name", numberShown: "full" },
};

const REGISTERS: Record<LicenceRole, Record<string, Register>> = { Optometrist: OPTOMETRIST, Optician: OPTICIAN };

// The provinces a person can pick for their registration, in the order they are shown.
export const licenceProvinces = (role: LicenceRole): string[] => Object.keys(REGISTERS[role]);
export const registerFor = (role: LicenceRole | null, province: string | null | undefined): Register | null => (role && province ? REGISTERS[role][province] ?? null : null);

// An optician's contact lens work is its own registration, level or advanced practice in several provinces and an area of practice in Ontario,
// so every optician says what they are registered to do, and the clinic checks it on the register.
export const DOES = ["eyeglasses", "contact_lenses"] as const;
export type Does = (typeof DOES)[number];
export const DOES_LABELS: Record<Does, string> = { eyeglasses: "Eyeglasses", contact_lenses: "Contact lenses" };

export type Licence = { province: string | null; number: string | null; does: Does[]; notYet: boolean };
export const NO_LICENCE: Licence = { province: null, number: null, does: [], notYet: false };

const NUMBER_SHAPE = /^[A-Za-z0-9][A-Za-z0-9 \-]{0,14}$/;

export const BC_NOTE = "In BC, give the number issued from June 2026. The old college numbers no longer work in the register.";

type Raw = { province: unknown; number: unknown; does: unknown; notYet: unknown };

// A checked licence for the role, or the messages for the person. The number is kept as text, so a leading zero stays. Someone who is not
// registered yet (a student, a new graduate, someone moving province) says so, and gives no number.
export function cleanLicence(role: LicenceRole | null, raw: Raw): { licence: Licence; errors?: undefined } | { licence?: undefined; errors: Record<string, string> } {
  if (!role) return { licence: NO_LICENCE };
  const notYet = raw.notYet === true || raw.notYet === "on" || raw.notYet === "yes";
  const province = typeof raw.province === "string" ? raw.province.trim() : "";
  const number = typeof raw.number === "string" ? raw.number.replace(/\s+/g, " ").trim() : "";
  const picked = (Array.isArray(raw.does) ? raw.does : []).map(String);
  const does = role === "Optician" ? DOES.filter((d) => picked.includes(d)) : [];
  if (notYet) return { licence: { province: null, number: null, does: [], notYet: true } };
  const errors: Record<string, string> = {};
  if (!province && !number) return { licence: { ...NO_LICENCE, does } };
  if (!province || !registerFor(role, province)) errors.licenceProvince = "Choose the province or territory that registered you.";
  if (!number) errors.licenceNumber = "Enter your registration number, or tick the box if you are not registered yet.";
  else if (!NUMBER_SHAPE.test(number)) errors.licenceNumber = "A registration number uses letters, digits and hyphens only, up to 15 characters.";
  if (Object.keys(errors).length) return { errors };
  return { licence: { province, number, does, notYet: false } };
}

// Whether a job needs a registration number from the person applying (Steve, 19th November 2026). Optometrist jobs, and optician jobs in a
// province that regulates opticians, need it from a candidate whose own role is that one. Someone who is not registered yet says so instead.
export function licenceRequiredFor(candidateRole: string | null | undefined, job: { role_category: string; province: string }): boolean {
  const role = licenceRole(candidateRole);
  if (!role || job.role_category !== role) return false;
  return role === "Optometrist" || Boolean(OPTICIAN[job.province]);
}

export const licenceComplete = (l: Licence | null | undefined) => Boolean(l && (l.notYet || (l.number && l.province)));

export const LICENCE_MISSING_TEXT = "This job asks for your registration number. Add it to your profile under Registered in, or tick that you are not registered yet.";

// What a clinic reads: the number and where it is from, or that the person says they are not registered yet.
export function licenceSummary(role: string | null | undefined, l: Licence | null | undefined): string {
  if (!l) return "Not given";
  if (l.notYet) return "Not registered yet (says the candidate)";
  if (!l.number) return "Not given";
  const reg = registerFor(licenceRole(role), l.province);
  return `${l.number}${l.province ? `, ${l.province}` : ""}${reg ? ` (${reg.college})` : ""}`;
}

export function doesSummary(l: Licence | null | undefined): string {
  return l?.does.length ? l.does.map((d) => DOES_LABELS[d]).join(" and ") : "";
}

// The wording beside the button that opens the register, for each kind of register.
export function registerAdvice(reg: Register): { button: string; help: string } {
  if (reg.kind === "number") {
    return {
      button: "Check this number on the register",
      help: reg.numberShown === "masked"
        ? "Search for this number, then check the name, profession and status match. This register shows only the last 2 digits of a number."
        : "Search for this number, then check the name and status match.",
    };
  }
  if (reg.directoryOnly) {
    return { button: "Look this person up in the directory", help: "This is a patient directory. It shows whether an optometrist is listed, but no registration number or status, so ask the College if you need to confirm the licence." };
  }
  if (reg.kind === "name" && reg.noStatus && reg.numberShown === "unknown") {
    return { button: "Look this person up on the directory", help: "Search the name. The directory lists a code in brackets beside each name, which may be the registration number, and shows no status line. Ask the College if you need to confirm the licence is current." };
  }
  if (reg.kind === "name" && reg.noStatus) {
    return { button: "Look this person up on the register", help: "Search the last name, then check the licence number matches. This roster shows no status line, so ask the College if you need to confirm the licence is current." };
  }
  if (reg.kind === "name") {
    return {
      button: "Look this person up on the register",
      help: reg.numberShown === "full"
        ? "Search the last name, then check the registration number and status match."
        : "Search the name, then check the status and that they are registered.",
    };
  }
  if (reg.noOnlineRegister) return { button: "Visit the College's website", help: "We could not find an online register for this College. Contact the College to check the person." };
  return { button: "Visit the College's website", help: "We have not set up a direct link to this College's register yet. Check the person with the College." };
}

// The surname to search for: the last word of the name, without brackets or punctuation, so "Wayne (Manny) Smith" gives "Smith".
export function surnameOf(fullName: string | null | undefined): string {
  const words = (fullName ?? "").replace(/[()"]/g, " ").trim().split(/\s+/).filter(Boolean);
  return (words[words.length - 1] ?? "").replace(/[^\p{L}\p{N}'\-]/gu, "").slice(0, 40);
}

// The address the register button opens: the register itself, or, where the register is known to search from a link, already searched for the
// candidate's surname (the clinic only opens a page and reads it, like typing the name in).
export function registerLink(reg: Register, candidateName?: string | null): string | null {
  if (!reg.url) return null;
  const surname = surnameOf(candidateName);
  if (!reg.nameParam || !surname) return reg.url;
  return `${reg.url}${reg.url.includes("?") ? "&" : "?"}${reg.nameParam}=${encodeURIComponent(surname)}`;
}
