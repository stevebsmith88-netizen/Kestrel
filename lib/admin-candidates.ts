// Admin, Candidates (Steve, 19th November 2026): who has registered, without the demo accounts. Kept free of the database so it can be tested.
// Shows who they are and what they have set up, never a resume, a note or the contents of an application.

// The demo and test accounts used to show people around, and Kestrel's own addresses (Steve, 19th November 2026): "+demo" or a start of "demo"
// in the part before the @, or any address at eyecarejobs.ca (no real candidate has one). A real person whose name merely contains "demo" is not hidden.
export function isDemoAccountEmail(email: string | null | undefined): boolean {
  const [local = "", domain = ""] = (email ?? "").toLowerCase().split("@");
  return local.startsWith("demo") || local.includes("+demo") || domain === "eyecarejobs.ca" || domain.endsWith(".eyecarejobs.ca");
}

export type CandidateRow = {
  id: string;
  name: string;
  email: string;
  joined: string;
  profession: string | null;
  place: string;
  hasResume: boolean;
  applications: number;
};

export type CandidateSource = {
  profiles: { id: string; full_name: string; created_at: string }[];
  emails: Map<string, string>;
  candidateProfiles: { user_id: string; profession: string | null; home_city: string | null; home_province: string | null; cv_path: string | null }[];
  applications: { candidate_id: string }[];
};

export function buildCandidateRows(src: CandidateSource): CandidateRow[] {
  const profile = new Map(src.candidateProfiles.map((p) => [p.user_id, p]));
  const applied = new Map<string, number>();
  for (const a of src.applications) applied.set(a.candidate_id, (applied.get(a.candidate_id) ?? 0) + 1);
  return src.profiles
    .filter((p) => !isDemoAccountEmail(src.emails.get(p.id)))
    .map((p) => {
      const c = profile.get(p.id);
      return {
        id: p.id,
        name: p.full_name || "Name not given",
        email: src.emails.get(p.id) ?? "",
        joined: p.created_at,
        profession: c?.profession ?? null,
        place: [c?.home_city, c?.home_province].filter(Boolean).join(", "),
        hasResume: Boolean(c?.cv_path),
        applications: applied.get(p.id) ?? 0,
      };
    })
    .sort((a, b) => b.joined.localeCompare(a.joined));
}

export function searchCandidates(rows: CandidateRow[], query: string): CandidateRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => [r.name, r.email, r.place, r.profession ?? ""].some((v) => v.toLowerCase().includes(q)));
}
