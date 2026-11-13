// The text served at /llms.txt: a short plain summary of Kestrel and its most useful public pages, in the format suggested at llmstxt.org,
// for AI assistants that look for one. Nobody has shown that assistants rely on it, so it is cheap insurance (docs/discoverability-plan.md).
// It lists only published blog posts, so a scheduled post never appears early. Kept free of app imports so lib/llms-text.test.ts can check it.

export type LlmsPost = { slug: string; title: string; description: string };

export function llmsText(site: string, posts: readonly LlmsPost[]): string {
  const lines = [
    "# Kestrel Eye Care Jobs",
    "",
    "> A Canada-wide job board for eye care: optometrists, opticians, optometric assistants and technicians, practice managers, patient care teams, and supplier and field based roles. Independent and corporate practices post side by side. Every job shows its pay.",
    "",
    "Kestrel Eye Care Jobs is at eyecarejobs.ca and is in English. Jobs based in Quebec are not listed for now. Every post must give a pay range (optometrist jobs may give a percentage, with the clinic's expected earnings in dollars), say whether it is for an existing vacancy, and say whether the employer uses AI to screen applicants. Posts are reviewed by a person before they go live and expire after 30 days. Pay figures on the resources pages come from Job Bank, the Government of Canada's labour market service.",
    "",
    "## Jobs",
    "",
    `- [Find eye care jobs](${site}/jobs): every live job, with filters for role, province, city, practice type and employment type`,
    `- [Eye care jobs by province and role](${site}/eye-care-jobs): pages for each province and role that have live jobs`,
    "",
    "## Pay and hiring rules",
    "",
    `- [Eye care resources for Canada](${site}/resources): typical pay by province and role from Job Bank, the rules for an eye care job ad, a supplier directory, and links to associations and regulators`,
    `- [Eye care pay in Canada: the yearly summary](${site}/resources/eye-care-pay-summary): where each role is paid most and least, and the gap between provinces`,
    `- [Ontario job ad rules for eye care clinics](${site}/resources/ontario-job-ads): who Ontario's job posting rules apply to and what a covered ad must include`,
    `- [Posting policy](${site}/posting-policy): what every job post on Kestrel must include`,
    `- [Fake jobs policy](${site}/fake-jobs): how to report a job that looks fraudulent, and what Kestrel does about it`,
    "",
    "## For clinics",
    "",
    `- [For clinics](${site}/clinics): how posting works`,
    `- [Price comparison](${site}/compare): what it costs to post an eye care job on Kestrel and on other Canadian job boards`,
    "",
    "## Guides",
    "",
    ...posts.map((p) => `- [${p.title}](${site}/blog/${p.slug}): ${p.description}`),
    "",
    "## Optional",
    "",
    `- [Help centre](${site}/help): how to use Kestrel as a candidate or a clinic`,
    `- [Privacy policy](${site}/privacy)`,
    `- [Terms](${site}/terms)`,
    "",
  ];
  return lines.join("\n");
}
