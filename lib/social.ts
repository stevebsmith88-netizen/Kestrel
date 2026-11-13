// Kestrel's own social pages. They appear as small icons in the footer and as sameAs links in the organisation data, so a page
// is added here once and shows up in both. Leave a link null until the page exists, so no icon ever leads nowhere.
export type SocialPage = { name: "LinkedIn" | "Instagram"; url: string };

export const LINKEDIN_URL = "https://www.linkedin.com/company/kestrel-eye-care-jobs/";
// The Instagram account (Steve, 13th November 2026).
export const INSTAGRAM_URL: string | null = "https://www.instagram.com/kestreleye26/";

export function socialPages(): SocialPage[] {
  const pages: SocialPage[] = [{ name: "LinkedIn", url: LINKEDIN_URL }];
  if (INSTAGRAM_URL) pages.push({ name: "Instagram", url: INSTAGRAM_URL });
  return pages;
}
