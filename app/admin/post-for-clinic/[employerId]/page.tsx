import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import JobForm from "@/components/JobForm";
import { requireRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Post for a clinic | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PostForOneClinic({ params }: { params: Promise<{ employerId: string }> }) {
  const session = await requireRole("admin");
  const { employerId } = await params;
  if (!UUID.test(employerId)) notFound();
  const db = supabaseAdmin();
  const { data: employer } = db ? await db.from("employers").select("id, clinic_name, city, province").eq("id", employerId).maybeSingle() : { data: null };
  if (!employer) notFound();
  return (
    <>
      <AppBar session={session} current="/admin/post-for-clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Posting for {employer.clinic_name}</p>
          <h1>Post a job</h1>
          <p className="lede2">Fill in the same form the clinic would. <Link href="/admin/post-for-clinic">Choose a different clinic</Link></p>
          <JobForm
            employerId={employer.id}
            initial={{
              title: "", role_category: "", employment_type: "", province: employer.province, city: employer.city, pay_period: "year", pay_min: "", pay_max: "",
              is_existing_vacancy: "", uses_ai_screening: "", description: "", apply_method: "kestrel", apply_url: "", work_arrangement: "on_site", territory: "", pay_extras: "",
            }}
          />
        </div>
      </main>
      <AppFooter />
    </>
  );
}
