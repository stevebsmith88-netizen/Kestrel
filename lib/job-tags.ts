// Equipment, software and specialty tags a clinic can tick on a job, and the software list a candidate can tick on their profile.
// The lists are fixed here, in code, so adding or renaming one needs no database change. Text only: no vendor logos. Kept free of imports from
// the app so the rules can be tested on their own (lib/job-tags.test.ts). Lists supplied by Steve on 9th November 2026.

export const SOFTWARE_TAGS = ["Visual Eyes", "RevolutionEHR", "Wink", "Acuitas", "eVision", "iFile", "OD Office Pro", "Optosys"] as const;
export const EQUIPMENT_TAGS = ["Optos", "OCT", "Humphrey visual field", "Topographer", "Retinal photographs"] as const;
export const SPECIALTY_TAGS = ["Dry eye and IPL", "Myopia control and ortho-k", "Vision therapy", "On-site edging lab"] as const;

export const TAG_GROUPS = [
  { key: "software", field: "tagsSoftware", column: "tags_software", label: "Practice software", list: SOFTWARE_TAGS as readonly string[] },
  { key: "equipment", field: "tagsEquipment", column: "tags_equipment", label: "Diagnostic equipment", list: EQUIPMENT_TAGS as readonly string[] },
  { key: "specialties", field: "tagsSpecialties", column: "tags_specialties", label: "Specialties", list: SPECIALTY_TAGS as readonly string[] },
] as const;

export type TagGroupKey = (typeof TAG_GROUPS)[number]["key"];
export type JobTags = { software: string[]; equipment: string[]; specialties: string[] };
export const NO_TAGS: JobTags = { software: [], equipment: [], specialties: [] };

// Only names on the list get through, once each, in the order the list gives them. Anything else (a typed-in address, an old name) is dropped.
export function cleanTags(value: unknown, allowed: readonly string[]): string[] {
  const given = (Array.isArray(value) ? value : [value]).filter((x): x is string => typeof x === "string").map((x) => x.trim());
  return allowed.filter((name) => given.includes(name));
}

// From the database row (columns may be missing on an older row or in a test).
export function tagsFromRow(row: { tags_software?: string[] | null; tags_equipment?: string[] | null; tags_specialties?: string[] | null } | null | undefined): JobTags {
  return {
    software: cleanTags(row?.tags_software ?? [], SOFTWARE_TAGS),
    equipment: cleanTags(row?.tags_equipment ?? [], EQUIPMENT_TAGS),
    specialties: cleanTags(row?.tags_specialties ?? [], SPECIALTY_TAGS),
  };
}

export const allTags = (tags: JobTags): string[] => [...tags.software, ...tags.equipment, ...tags.specialties];

// The short line on a job card: up to 3 names, then "and 2 more". Empty when there are none.
export function tagLine(tags: JobTags, show = 3): string {
  const all = allTags(tags);
  if (all.length === 0) return "";
  if (all.length <= show) return all.join(", ");
  const more = all.length - show;
  return `${all.slice(0, show).join(", ")} and ${more} more`;
}

// Search filters. Within one group a job matches if it has any ticked name; every group with something ticked must match.
export type TagFilters = { software: string[]; equipment: string[]; specialties: string[] };

export function cleanTagFilters(raw: Record<string, string | string[] | undefined>): TagFilters {
  return {
    software: cleanTags(raw.software, SOFTWARE_TAGS),
    equipment: cleanTags(raw.equipment, EQUIPMENT_TAGS),
    specialties: cleanTags(raw.specialty, SPECIALTY_TAGS),
  };
}

export const hasTagFilters = (f: TagFilters) => f.software.length + f.equipment.length + f.specialties.length > 0;

export function jobMatchesTags(tags: JobTags, filters: TagFilters): boolean {
  return (["software", "equipment", "specialties"] as const).every((k) => filters[k].length === 0 || filters[k].some((name) => tags[k].includes(name)));
}
