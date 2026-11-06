import "server-only";
import { POSTS } from "@/content/posts";
import { visiblePosts } from "@/lib/blog";
import { payGuide, type PayGuideRow } from "@/lib/pay-guide";
import type { LandingRole } from "@/lib/landing";

// Typical pay for one province, or for one role in a province, from the Job Bank figures the Resources page uses.
// Optometrist pay is left off the public table (Steve, 6th November 2026), so pages show none for that role.
export function provincePay(province: string): PayGuideRow[] {
  return payGuide()[province] ?? [];
}
export function rolePay(province: string, role: string): PayGuideRow[] {
  return provincePay(province).filter((r) => r.role === role);
}

// One published blog post that helps a reader of this role's page. A post scheduled for later is never linked.
const POST_FOR_ROLE: Record<string, string> = {
  optician: "optician-interview-questions",
  "optometric-assistant": "optometric-assistant-jobs-canada",
  "sales-representative": "field-based-eye-care-jobs",
  trainer: "field-based-eye-care-jobs",
  "field-technician": "field-based-eye-care-jobs",
  "account-manager": "field-based-eye-care-jobs",
};
export function postForRole(role: LandingRole | null): { slug: string; title: string } | null {
  const visible = visiblePosts(POSTS, new Date(), false);
  const slug = role ? POST_FOR_ROLE[role.slug] ?? "working-in-eye-care" : "working-in-eye-care";
  const post = visible.find((p) => p.slug === slug);
  return post ? { slug: post.slug, title: post.title } : null;
}
