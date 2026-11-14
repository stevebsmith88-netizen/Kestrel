import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { CancelInvite, InviteForm, LevelForm, MakeOwner, RemoveMember, ResendInvite } from "@/components/TeamForms";
import { requireRole } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { levelLabel, TEAM_MAX } from "@/lib/team";
import { loadTeam } from "@/lib/team-server";

export const metadata: Metadata = { title: "Your clinic team | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// My clinic, Team (Steve, 14th November 2026; migration 0045). The owner invites people, chooses what each can do, and removes anyone who
// leaves. Everyone else on the team sees who is on it.
export default async function ClinicTeam({ searchParams }: { searchParams: Promise<{ handed?: string }> }) {
  const session = await requireRole("clinic");
  const { handed } = await searchParams;
  const employer = await getMyEmployer(session.userId);
  if (!employer) redirect("/clinic/profile");
  const admin = supabaseAdmin();
  const { people, invites } = admin ? await loadTeam(admin, employer.id) : { people: [], invites: [] };
  const owner = employer.level === "owner";
  const full = people.length + invites.length >= TEAM_MAX;
  return (
    <>
      <AppBar session={session} current="/clinic/team" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">{employer.clinic_name}</p>
          <h1>Your clinic team</h1>
          <p className="lede2">
            {owner
              ? `Up to ${TEAM_MAX} people, including you, can use your clinic's account. Only you can change the profile and the team.`
              : `You are on this team (${levelLabel(employer.level).toLowerCase()}). Only the owner can change the team.`}
          </p>
          {handed && <p className="notice" role="status">Done. The new owner manages the team from now on, and you can still view and edit.</p>}

          <ul className="teamlist">
            {people.map((p) => (
              <li key={p.userId} className="card">
                <div>
                  <strong>{p.name}{p.userId === session.userId ? " (you)" : ""}</strong>
                  <p className="meta">{p.email} · {levelLabel(p.level)}{p.since ? ` · since ${longDate(p.since)}` : ""}</p>
                </div>
                {owner && p.level !== "owner" && (
                  <div className="teamacts">
                    <LevelForm userId={p.userId} level={p.level} />
                    <RemoveMember userId={p.userId} name={p.name.split(" ")[0] || "them"} />
                    <details className="teammore"><summary>Hand the clinic over</summary><MakeOwner userId={p.userId} name={p.name.split(" ")[0] || "them"} /></details>
                  </div>
                )}
              </li>
            ))}
            {invites.map((i) => (
              <li key={i.id} className="card invited">
                <div>
                  <strong>{i.name}</strong> <span className="badge">Invited</span>
                  <p className="meta">{i.email} · {levelLabel(i.level)} · code works until {longDate(i.expires_at)}</p>
                </div>
                {owner && (
                  <div className="teamacts">
                    <ResendInvite id={i.id} />
                    <CancelInvite id={i.id} />
                  </div>
                )}
              </li>
            ))}
          </ul>

          {owner && (
            <section className="teaminvite">
              <h2>Invite someone</h2>
              {full ? (
                <p className="help">Your team is full ({TEAM_MAX} people, counting open invitations). Remove someone or cancel an invitation to add another.</p>
              ) : (
                <p className="help">They get an email with a link and a code. New people create an account with it; anyone with a Kestrel clinic account signs in and enters the code.</p>
              )}
              <InviteForm full={full} />
            </section>
          )}
          <p className="help">Stuck? <Link href="/account/help">Ask Kestrel for help</Link> and we will sort it out with you.</p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
