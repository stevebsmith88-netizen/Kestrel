// The outside links on the Resources page (associations, regulators, labour market information). Only a link with a `checked` date is shown.
// A link is checked when a page on that address has been seen to exist. Entries with `checked: null` are held back until Steve (or a
// session that can reach the site) opens the link and confirms it is the right organisation and still live. Then set the date.
// Kestrel is not affiliated with any of these organisations, and the page says so.

export type ResourceLink = { name: string; url: string; note: string; checked: string | null };
export type ResourceGroup = { id: string; heading: string; intro: string; links: ResourceLink[] };

export const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    id: "associations",
    heading: "Professional associations",
    intro: "Where the profession speaks for itself, with news, events and member services.",
    links: [
      { name: "Canadian Association of Optometrists", url: "https://opto.ca", note: "The national association for optometrists.", checked: "2026-11-06" },
      { name: "Provincial optometric associations", url: "https://opto.ca/provinces", note: "The list of provincial associations, kept by the Canadian Association of Optometrists: BC Doctors of Optometry, Alberta Association of Optometrists, Saskatchewan Association of Optometrists, Manitoba Association of Optometrists, Ontario Association of Optometrists, New Brunswick Association of Optometrists, Nova Scotia Association of Optometrists, Prince Edward Island Association of Optometrists, and Newfoundland and Labrador Association of Optometrists.", checked: "2026-11-06" },
      { name: "Canadian Association of Optometrists job board", url: "https://opto.ca/job-board", note: "The association's job board for optometrists and optometric assistants.", checked: "2026-11-08" },
      { name: "Canadian Certified Optometric Assistants (CCOA)", url: "https://opto.ca/ccoa", note: "The Canadian Association of Optometrists program for certified optometric assistants. Its career centre is the association's job board.", checked: "2026-11-09" },
      { name: "Opticians Association of Canada", url: "https://www.opticians.ca", note: "The national association for opticians.", checked: "2026-11-06" },
      { name: "Ontario Association of Optometrists", url: "https://optom.on.ca", note: "The provincial association for optometrists in Ontario.", checked: "2026-11-06" },
      { name: "Alberta Association of Optometrists", url: "https://www.optometrists.ab.ca", note: "The provincial association for optometrists in Alberta.", checked: "2026-11-06" },
    ],
  },
  {
    id: "regulators",
    heading: "Regulators and licensing",
    intro: "Licensing is set province by province. Use the regulator for the province where you plan to work.",
    links: [
      { name: "College of Health and Care Professionals of BC: optometrists", url: "https://chcpbc.org/for-professions/optometrists", note: "British Columbia. The College of Optometrists of BC joined this college in June 2024.", checked: "2026-11-06" },
      { name: "College of Health and Care Professionals of BC: opticians", url: "https://chcpbc.org/for-professions/opticians", note: "British Columbia. The College of Opticians of BC joined this college in June 2024.", checked: "2026-11-06" },
      { name: "Alberta College of Optometrists", url: "https://collegeofoptometrists.ab.ca", note: "Alberta, optometrists.", checked: "2026-11-06" },
      { name: "College of Optometrists of Ontario", url: "https://collegeoptom.on.ca", note: "Ontario, optometrists.", checked: "2026-11-06" },
      { name: "National Alliance of Canadian Optician Regulators (NACOR)", url: "https://nacor.ca", note: "Runs the national opticianry exams for the provincial regulators.", checked: "2026-11-06" },
      // Held back until opened and confirmed:
      { name: "College of Opticians of Ontario", url: "https://collegeofopticians.ca", note: "Ontario, opticians.", checked: "2026-11-06" },
    ],
  },
  {
    id: "labour",
    heading: "Labour market information",
    intro: "Government of Canada pages with job counts and outlook for each occupation.",
    links: [
      { name: "Job Bank: optometrist jobs in Canada", url: "https://www.jobbank.gc.ca/marketreport/jobs/18193/ca", note: "Current openings and where they are.", checked: "2026-11-06" },
      { name: "Job Bank: optometric assistant job prospects", url: "https://www.jobbank.gc.ca/marketreport/outlook-occupation/27193/ca", note: "The outlook for the occupation across Canada.", checked: "2026-11-06" },
    ],
  },
];

// What the page shows: checked links only, and no heading for an empty group.
export function listedGroups(groups: readonly ResourceGroup[] = RESOURCE_GROUPS): ResourceGroup[] {
  return groups.map((g) => ({ ...g, links: g.links.filter((l) => l.checked !== null) })).filter((g) => g.links.length > 0);
}
