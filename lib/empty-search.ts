// When a search finds nothing, these are the one click ways to get a wider search: each link is the same search with one thing loosened.
// Only real options are offered, so a link never leads to a search that is narrower than the one the person just ran.
export type SearchFilters = { q?: string; city?: string; radius?: number; province?: string; role?: string; type?: string[]; practice?: string; arrangement?: string; tags?: { software: string[]; equipment: string[]; specialties: string[] } };
export type Suggestion = { label: string; href: string };

const RADII = [10, 25, 50];

export function searchHref(f: SearchFilters) {
  const params = new URLSearchParams();
  (["q", "city", "province", "role", "practice", "arrangement"] as const).forEach((k) => f[k] && params.set(k, f[k] as string));
  if (f.city && f.radius) params.set("radius", String(f.radius));
  f.type?.forEach((t) => params.append("type", t));
  f.tags?.software.forEach((t) => params.append("software", t));
  f.tags?.equipment.forEach((t) => params.append("equipment", t));
  f.tags?.specialties.forEach((t) => params.append("specialty", t));
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}

export function emptySearchSuggestions(f: SearchFilters, max = 5): Suggestion[] {
  const out: Suggestion[] = [];
  const radius = f.radius ?? 25;
  const wider = RADII.find((r) => r > radius);
  if (f.city && wider) out.push({ label: `Widen the distance to ${wider} km`, href: searchHref({ ...f, radius: wider }) });
  if (f.city) out.push({ label: f.province ? `Search all of ${f.province}` : "Search all of Canada", href: searchHref({ ...f, city: "", radius: undefined }) });
  if (f.province) out.push({ label: "Search all of Canada", href: searchHref({ ...f, province: "", city: "", radius: undefined }) });
  if (f.role) out.push({ label: "Any role", href: searchHref({ ...f, role: "" }) });
  if (f.practice) out.push({ label: "Any type of employer", href: searchHref({ ...f, practice: "" }) });
  if (f.type?.length) out.push({ label: "Any type of work", href: searchHref({ ...f, type: [] }) });
  if (f.arrangement) out.push({ label: "On site or field based", href: searchHref({ ...f, arrangement: "" }) });
  if (f.tags?.software.length) out.push({ label: "Any practice software", href: searchHref({ ...f, tags: { ...f.tags, software: [] } }) });
  if (f.tags?.equipment.length) out.push({ label: "Any equipment", href: searchHref({ ...f, tags: { ...f.tags, equipment: [] } }) });
  if (f.tags?.specialties.length) out.push({ label: "Any specialty", href: searchHref({ ...f, tags: { ...f.tags, specialties: [] } }) });
  if (f.q) out.push({ label: `Drop the word "${f.q}"`, href: searchHref({ ...f, q: "" }) });
  return out.slice(0, max);
}
