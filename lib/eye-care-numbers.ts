// The numbers shown on the home page, and where each comes from. Only figures that can be defended with a public source
// are shown as facts. The roles figure is Kestrel's own estimate, shown as a floor ("more than") and labelled as an estimate.
// The working is in docs/market-sizing.md. Re-check these against the sources before changing them, and keep both in step.
export const CHECKED_ON = "31st October 2026";

export type EyeCareNumber = { value: number; suffix: string; label: string; source: string; estimate?: boolean };

export const EYE_CARE_NUMBERS: EyeCareNumber[] = [
  { value: 6400, suffix: "", label: "optometrists working in Canada", source: "Statistics Canada, 2023" },
  { value: 11700, suffix: "", label: "opticians working in Canada", source: "Statistics Canada, 2023" },
  { value: 4000, suffix: "+", label: "optometry practices across the country", source: "Industry directories, 2025" },
  { value: 2000, suffix: "+", label: "eye care roles advertised every year", source: "Kestrel estimate", estimate: true },
];

// Short names for the line under the numbers. The full titles are in docs/market-sizing.md.
export const NUMBER_SOURCES: { name: string; url: string }[] = [
  { name: "Statistics Canada", url: "https://www.statcan.gc.ca/o1/en/plus/6173-vision-health-month-eyes-data" },
  { name: "IBISWorld", url: "https://www.ibisworld.com/canada/number-of-businesses/optometrists/1560" },
  { name: "Scott's Directories", url: "https://scottsdirectories.com/canada-b2b-database/naics621320-offices-of-optometrists" },
  { name: "Job Bank", url: "https://www.jobbank.gc.ca/outlookreport/occupation/4345" },
];

export const formatCount = (n: number) => n.toLocaleString("en-CA");
