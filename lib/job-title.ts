// Tidies a job title when it was typed in all capitals or all lowercase (Steve, November 2026). A title that already mixes cases is left exactly as
// the clinic wrote it. Otherwise each word gets a capital at the start, except small joining words (and, of, in), and short eye care
// abbreviations stay in capitals (OD, RO, CL, ECP). Kept free of imports so it can be tested on its own (lib/job-title.test.ts).

const SMALL = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "with", "per", "vs"]);
// Words that are always written in capitals in eye care job titles.
const KEEP_CAPS = new Set(["od", "ro", "cl", "clf", "ecp", "abo", "coa", "cot", "comt", "oma", "lc", "hr", "it", "rn", "pt", "ft", "ii", "iii", "iv", "gm", "ceo", "cfo", "coo", "vp", "usa", "uk", "bc", "ab", "sk", "mb", "qc", "nb", "ns", "nl", "nt", "nu", "yt"]);

function isShouting(title: string): boolean {
  const letters = title.replace(/[^A-Za-z]/g, "");
  return letters.length >= 4 && (letters === letters.toUpperCase() || letters === letters.toLowerCase());
}

export function tidyTitle(title: string): string {
  const t = title.trim().replace(/\s+/g, " ");
  if (!isShouting(t)) return t;
  let first = true;
  return t.replace(/[A-Za-z][A-Za-z']*/g, (word, offset: number) => {
    const w = word.toLowerCase();
    const afterOpen = offset === 0 || /[(/\-–—:]/.test(t[offset - 1]) || /[(/\-–—:]\s$/.test(t.slice(0, offset));
    const isFirst = first;
    first = false;
    if (KEEP_CAPS.has(w)) return word.toUpperCase();
    if (SMALL.has(w) && !isFirst && !afterOpen) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
}

// A job title suggested from what the clinic has already chosen (Steve, 14th November 2026; rules only, no AI). The title box fills itself in and
// the clinic can change it. It comes from the role, so an optometrist title can never be suggested for another role. The town, pay and the
// clinic's name stay out of the title: Google wants the job title only, and the page title and description carry the town.
const TITLE_FOR_ROLE: Record<string, string> = {
  "Optometrist": "Optometrist",
  "Optician": "Optician",
  "Optometric assistant or technician": "Optometric Assistant",
  "Practice or clinic manager": "Practice Manager",
  "Patient care or reception": "Patient Care Coordinator",
  "Vision therapist": "Vision Therapist",
  "Sales or territory representative": "Sales Representative",
  "Trainer or clinical educator": "Clinical Educator",
  "Field service or equipment technician": "Field Service Technician",
  "Account or practice development manager": "Account Manager",
};

// A specialty the clinic ticks shows in an optometrist's title, only when exactly 1 of these is ticked.
const SPECIALTY_PREFIX: Record<string, string> = {
  "Dry eye and IPL": "Dry Eye",
  "Myopia control and ortho-k": "Myopia Control",
};

export function suggestTitle({ role, employmentType, specialties = [] }: { role: string; employmentType?: string; specialties?: string[] }): string {
  const base = TITLE_FOR_ROLE[role];
  if (!base) return role.trim();
  let title = base;
  if (role === "Optometrist") {
    const picked = specialties.filter((s) => SPECIALTY_PREFIX[s]);
    if (picked.length === 1) title = `${SPECIALTY_PREFIX[picked[0]]} ${title}`;
  }
  if (employmentType === "Locum") return `Locum ${title}`;
  if (employmentType === "Full time" || employmentType === "Part time") return `${title}, ${employmentType}`;
  return title;
}
