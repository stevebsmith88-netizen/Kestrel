import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingView from "@/components/LandingView";
import { LANDING_PROVINCES, LANDING_ROLES, comboHref, comboTitle, landingDescription, landingIndexable, provinceFromSlug, provinceHref, provinceSlug, roleFromSlug } from "@/lib/landing";
import { postForRole, rolePay } from "@/lib/landing-pages";
import { getComboCounts, searchJobs } from "@/lib/public-jobs";
import { shareMetadata } from "@/lib/share";

// Saved once and shown to everyone, then built again at most every 5 minutes (audit P1-10). force-static means that even if something on
// the page tried to read who is visiting, it would see nobody, so a saved page can never hold anything about a person. The rebuild brings
// in scheduled blog posts on their date, and the launch switch, which the header checks every 5 minutes (lib/launch.ts).
export const revalidate = 300;
export const dynamic = "force-static";
export const generateStaticParams = () => LANDING_PROVINCES.flatMap((p) => LANDING_ROLES.map((r) => ({ province: provinceSlug(p), role: r.slug })));

type Params = Promise<{ province: string; role: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { province: ps, role: rs } = await params;
  const province = provinceFromSlug(ps);
  const role = roleFromSlug(rs);
  if (!province || !role) return {};
  const { total } = await searchJobs({ province, role: role.role });
  const title = comboTitle(role, province);
  return {
    ...shareMetadata({ title, description: landingDescription(title, total), path: comboHref(province, role) }),
    ...(landingIndexable(total) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function ComboPage({ params }: { params: Params }) {
  const { province: ps, role: rs } = await params;
  const province = provinceFromSlug(ps);
  const role = roleFromSlug(rs);
  if (!province || !role) notFound();
  const [{ jobs, total }, combos] = await Promise.all([searchJobs({ province, role: role.role }), getComboCounts()]);
  const sameProvince = LANDING_ROLES.filter((r) => r.slug !== role.slug).map((r) => ({ href: comboHref(province, r), label: `${r.name} jobs in ${province}`, count: combos[`${province}|${r.role}`] ?? 0 })).filter((l) => l.count > 0);
  const sameRole = LANDING_PROVINCES.filter((p) => p !== province).map((p) => ({ href: comboHref(p, role), label: `${role.name} jobs in ${p}`, count: combos[`${p}|${role.role}`] ?? 0 })).filter((l) => l.count > 0);
  return (
    <LandingView
      heading={comboTitle(role, province)}
      lede={`Live ${role.name.toLowerCase()} jobs in ${province}, from independent and corporate practices. Every job shows its pay, and a person reads every post before it goes live.`}
      crumbs={[{ name: "Eye care jobs", href: "/eye-care-jobs" }, { name: province, href: provinceHref(province) }, { name: role.name, href: comboHref(province, role) }]}
      jobs={jobs}
      total={total}
      searchHref={`/jobs?province=${encodeURIComponent(province)}&role=${encodeURIComponent(role.role)}`}
      empty={`Nobody has posted a ${role.name.toLowerCase()} job in ${province} yet. Join the waitlist and we will tell you when one appears, or look at the other roles and provinces below.`}
      pay={rolePay(province, role.role)}
      payTitle={`Typical pay for ${role.name.toLowerCase()} roles in ${province}`}
      linkGroups={[
        { title: `Other roles hiring in ${province}`, links: sameProvince },
        { title: `${role.name} jobs in other provinces`, links: sameRole },
        { title: `More in ${province}`, links: [{ href: provinceHref(province), label: `Eye care jobs in ${province}` }] },
      ]}
      blog={postForRole(role)}
    />
  );
}
