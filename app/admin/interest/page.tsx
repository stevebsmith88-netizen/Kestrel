import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { loadInterest } from "@/lib/admin-loaders";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Interest in clinics | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function Interest() {
  const session = await requireRole("admin");
  const { groups, error } = await loadInterest(supabaseAdmin());
  return (
    <>
      <AppBar session={session} current="/admin/interest" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Interest in clinics</h1>
          <p className="lede2">Clinics and companies that are not on Kestrel yet, which candidates said they would like to work for, with how many people asked. No candidate is named here. Nothing is sent to these clinics. When clinic outreach is switched on, a clinic can be sent 1 short email to its published business address, with no candidate&apos;s name or details in it.</p>
          {error && <p className="notice warn" role="alert">This list is not available yet. Run migration 0055 on this database first.</p>}
          {!error && groups.length === 0 && <p className="meta">Nobody has asked yet.</p>}
          {groups.length > 0 && (
            <ul className="teamlist">
              {groups.map((g) => (
                <li key={`${g.name}|${g.town}`} className="card">
                  <div>
                    <strong>{g.name}</strong>
                    <p className="meta">{[g.town, g.province].filter(Boolean).join(", ") || "Place not given"}{g.website ? ` · ${g.website}` : ""}</p>
                  </div>
                  <div>
                    <strong>{g.people} {g.people === 1 ? "person" : "people"}</strong>
                    <p className="meta">Latest {longDate(g.latest)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
