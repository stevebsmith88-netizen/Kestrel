import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingView from "@/components/LandingView";
import { LANDING_PROVINCES, LANDING_ROLES, comboHref, landingDescription, landingIndexable, provinceFromSlug, provinceHref, provinceSlug, provinceTitle } from "@/lib/landing";
import { postForRole, provincePay } from "@/lib/landing-pages";
import { searchJobs, getComboCounts } from "@/lib/public-jobs";
import { shareMetadata } from "@/lib/share";

// Saved once and shown to everyone, then built again at most every 5 minutes (audit P1-10). force-static means that even if something on
// the page tried to read who is visiting, it would see nobody, so a saved page can never hold anything about a person. The rebuild brings
// in scheduled blog posts on their date, and the launch switch, which the header checks every 5 minutes (lib/launch.ts).
export const revalidate = 300;
export const dynamic = "force-static";
export const generateStaticParams = () => LANDING_PROVINCES.map((p) => ({ province: provinceSlug(p) }));

export async function generateMetadata({ params }: { params: Promise<{ province: string }> }): Promise<Metadata> {
  const province = provinceFromSlug((await params).province);
  if (!province) return {};
  const { total } = await searchJobs({ province });
  return {
    ...shareMetadata({ title: provinceTitle(province), description: landingDescription(provinceTitle(province), total), path: provinceHref(province) }),
    ...(landingIndexable(total) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function ProvincePage({ params }: { params: Promise<{ province: string }> }) {
  const province = provinceFromSlug((await params).province);
  if (!province) notFound();
  const [{ jobs, total }, combos] = await Promise.all([searchJobs({ province }), getComboCounts()]);
  const roleLinks = LANDING_ROLES.map((r) => ({ href: comboHref(province, r), label: `${r.name} jobs`, count: combos[`${province}|${r.role}`] ?? 0 })).filter((l) => l.count > 0);
  const otherProvinces = LANDING_PROVINCES.filter((p) => p !== province).map((p) => ({ p, count: Object.entries(combos).filter(([k]) => k.startsWith(`${p}|`)).reduce((n, [, c]) => n + c, 0) })).filter((x) => x.count > 0);
  return (
    <LandingView
      heading={provinceTitle(province)}
      lede={`Live eye care jobs in ${province}, from independent and corporate practices. Every job shows its pay, and a person reads every post before it goes live.`}
      crumbs={[{ name: "Eye care jobs", href: "/eye-care-jobs" }, { name: province, href: provinceHref(province) }]}
      jobs={jobs}
      total={total}
      searchHref={`/jobs?province=${encodeURIComponent(province)}`}
      empty={`Nobody has posted a job in ${province} yet. Join the waitlist and we will tell you when the first ones appear, or search the rest of Canada.`}
      pay={provincePay(province)}
      payTitle={`Typical pay in ${province}`}
      linkGroups={[
        { title: `Roles hiring in ${province}`, links: roleLinks },
        { title: "Other provinces with jobs", links: otherProvinces.map((x) => ({ href: provinceHref(x.p), label: x.p, count: x.count })) },
      ]}
      blog={postForRole(null)}
    />
  );
}
