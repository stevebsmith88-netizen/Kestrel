// City and radius search: finds a place by name and the places within 10, 25 or 50 km of it.
// The place list is GeoNames data (CC BY 4.0), see lib/places-data.ts. Kept free of app imports so it can be tested on its own.
import { PLACE_PROVINCES, PLACE_ROWS } from "./places-data.ts";

export const RADIUS_OPTIONS = [10, 25, 50] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];

export type Place = { name: string; province: string; lat: number; lng: number; population: number };

// Extra names people use for parts of big cities. GeoNames lists most of these as part of the city.
const ALIASES: Record<string, string> = {
  "north york": "Toronto", scarborough: "Toronto", etobicoke: "Toronto", "east york": "Toronto", "york": "Toronto",
};

// Lower case, without accents, full stops or apostrophes, and "saint" written as "st".
export function norm(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’`]/g, "")
    .replace(/\bsaint\b/g, "st")
    .replace(/\bsainte\b/g, "ste")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PLACES: Place[] = PLACE_ROWS.map(([name, plain, province, lat, lng, population]) => ({ name: plain || name, province: PLACE_PROVINCES[province], lat, lng, population }));
const KEYS = new Map<string, Place[]>();
PLACE_ROWS.forEach(([name, plain, province, lat, lng, population]) => {
  const place = { name: plain || name, province: PLACE_PROVINCES[province], lat, lng, population };
  for (const key of new Set([norm(name), norm(plain || name)])) KEYS.set(key, [...(KEYS.get(key) ?? []), place]);
});

// The place a person typed, or null. With a province given, only that province is looked at. Otherwise the biggest place with that name wins.
export function findPlace(input: string, province?: string): Place | null {
  const typed = norm(input.replace(/,.*$/, ""));
  if (!typed) return null;
  const key = KEYS.has(typed) ? typed : norm(ALIASES[typed] ?? "");
  const matches = (KEYS.get(key) ?? []).filter((p) => !province || p.province === province);
  return matches.sort((a, b) => b.population - a.population)[0] ?? null;
}

// Straight line distance in kilometres between two points on the earth.
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const placeKey = (city: string, province: string) => `${norm(city)}|${province}`;

// Every place within the radius of the centre (the centre included), as keys of "city|province" to match against a job's city and province.
// A job's city is matched on its name only, and also through the aliases above, so "North York" counts as Toronto.
export function nearbyKeys(centre: Place, km: number): Set<string> {
  const keys = new Set<string>();
  for (const p of PLACES) if (distanceKm(centre, p) <= km) keys.add(placeKey(p.name, p.province));
  keys.add(placeKey(centre.name, centre.province));
  for (const [alias, city] of Object.entries(ALIASES)) {
    const target = findPlace(city, centre.province);
    if (target && keys.has(placeKey(target.name, target.province))) keys.add(placeKey(alias, target.province));
  }
  return keys;
}

export const placeLabel = (p: Place) => `${p.name}, ${p.province}`;
