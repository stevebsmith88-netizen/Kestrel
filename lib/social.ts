// Kestrel's own social pages. They appear as small icons in the footer and as sameAs links in the organisation data, so a page
// is added here once and shows up in both. Leave a link null until the page exists, so no icon ever leads nowhere.
export type SocialPage = { name: "LinkedIn" | "Instagram" | "Facebook" | "Reddit"; url: string };

export const LINKEDIN_URL = "https://www.linkedin.com/company/kestrel-eye-care-jobs/";
// The Instagram account (Steve, 13th November 2026).
export const INSTAGRAM_URL: string | null = "https://www.instagram.com/kestreleye26/";

// The Facebook Page (Steve, 15th November 2026). Still the long numbered address, because Meta offered no username on a new
// Page. Swap it for the short address (facebook.com/<username>) when one can be set.
export const FACEBOOK_URL: string | null = "https://www.facebook.com/profile.php?id=61596238157146";

// The Reddit community for eye care jobs in Canada (Steve, 15th November 2026). Plan: item 22 in CLAUDE.md.
export const REDDIT_URL: string | null = "https://www.reddit.com/r/EyeCareJobsCanada/";

export function socialPages(): SocialPage[] {
  const pages: SocialPage[] = [{ name: "LinkedIn", url: LINKEDIN_URL }];
  if (INSTAGRAM_URL) pages.push({ name: "Instagram", url: INSTAGRAM_URL });
  if (FACEBOOK_URL) pages.push({ name: "Facebook", url: FACEBOOK_URL });
  if (REDDIT_URL) pages.push({ name: "Reddit", url: REDDIT_URL });
  return pages;
}
