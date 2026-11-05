// Labelled AI starting ranges, for a role and province that has no official Job Bank figure and fewer than 10 Kestrel posts.
// Nothing is shown from this list until an entry is added, and an entry is added only after Steve has read it.
// Never fill this from pay scraped from job boards (Indeed, LinkedIn, Jobs4ECPs): the project rules forbid it.
// Each entry is a yearly range in Canadian dollars. Hourly pay is compared after converting at 2,080 hours.
// How to produce and review entries: docs/pay-benchmark.md, "AI starting ranges".

export type StartingRange = {
  role: string;
  province: string;
  low: number; // yearly, dollars
  high: number; // yearly, dollars
  madeOn: string; // the day the range was made, as 2026-11-05
  basis: string; // one line on what the AI was given, for example "public Job Bank figures for nearby occupations"
};

export const STARTING_RANGES: readonly StartingRange[] = [];
