import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/jobs";
import { markAllRead, markOneRead, openMessage } from "@/lib/notification-actions";
import { getMyNotifications } from "@/lib/notifications";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { accessOpen, kindLabel, reasonLabel } from "@/lib/support";

type Ticket = { id: string; kind: string; reason: string | null; message: string; status: string; access_until: string | null; created_at: string; closed_at: string | null };

// The person's own help requests and feedback (migration 0046), newest first. Read with the server key, for this person only. On a database
// without the table, none.
async function myTickets(userId: string): Promise<Ticket[]> {
  const admin = supabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin.from("support_requests").select("id, kind, reason, message, status, access_until, created_at, closed_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  return error ? [] : ((data ?? []) as Ticket[]);
}

export const metadata: Metadata = { title: "Inbox | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// The in account inbox: short messages from Kestrel about what has happened on the account. One way only, nobody replies in it.
export default async function Inbox({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireRole("candidate", "clinic");
  const { tab } = await searchParams;
  const tickets = await myTickets(session.userId);
  const openTickets = tickets.filter((t) => t.status === "open").length;
  // Help requests and feedback have their own tab, so open requests are not lost among the updates (Steve, 14th November 2026).
  if (tab === "help") return <TicketsView session={session} tickets={tickets} openTickets={openTickets} />;
  const items = await getMyNotifications();
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <>
      <AppBar session={session} current="/account/inbox" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Your inbox</h1>
          <p className="lede2">Updates about your account, kept here as well as in your email. This is for reading only: to reach us, use <Link href="/account/help">Help and feedback</Link>.</p>
          <InboxTabs current="messages" openTickets={openTickets} />
          {items.length === 0 ? (
            <section className="card emptystate">
              <h2>Nothing here yet</h2>
              <p>{session.role === "candidate" ? "When a clinic updates one of your applications, you will see it here." : "When someone applies, or we review one of your jobs, you will see it here."}</p>
            </section>
          ) : (
            <section className="card">
              {unread > 0 && (
                <form action={markAllRead}>
                  <button type="submit" className="btn sm ghost">Mark all as read</button>
                </form>
              )}
              <ul className="inboxlist">
                {items.map((n) => (
                  <li key={n.id} className={n.read_at ? undefined : "unread"}>
                    <h2>{n.title}</h2>
                    <span className="when">{longDate(n.created_at)}</span>
                    {n.body && <p>{n.body}</p>}
                    {(n.href || !n.read_at) && (
                      <span className="actions">
                        {n.href && (
                          <form action={openMessage}>
                            <input type="hidden" name="id" value={n.id} />
                            <button type="submit" className="btn sm ghost">Open</button>
                          </form>
                        )}
                        {!n.href && !n.read_at && (
                          <form action={markOneRead}>
                            <input type="hidden" name="id" value={n.id} />
                            <button type="submit" className="btn sm ghost">Mark as read</button>
                          </form>
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

function InboxTabs({ current, openTickets }: { current: "messages" | "help"; openTickets: number }) {
  return (
    <nav className="tabs" aria-label="Inbox">
      <Link href="/account/inbox" className={`tab ${current === "messages" ? "on" : ""}`} aria-current={current === "messages" ? "page" : undefined}>Messages</Link>
      <Link href="/account/inbox?tab=help" className={`tab ${current === "help" ? "on" : ""}`} aria-current={current === "help" ? "page" : undefined}>Help requests{openTickets ? ` (${openTickets} open)` : ""}</Link>
    </nav>
  );
}

function TicketsView({ session, tickets, openTickets }: { session: Awaited<ReturnType<typeof requireRole>>; tickets: Ticket[]; openTickets: number }) {
  return (
    <>
      <AppBar session={session} current="/account/inbox" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Your inbox</h1>
          <p className="lede2">Your help requests and feedback. We reply by email, and mark a request done here once it is sorted.</p>
          <InboxTabs current="help" openTickets={openTickets} />
          {tickets.length === 0 ? (
            <section className="card emptystate">
              <h2>No requests yet</h2>
              <p>Need a hand, found a problem, or have an idea? Tell us from Help and feedback.</p>
              <Link href="/account/help" className="btn">Help and feedback</Link>
            </section>
          ) : (
            <section className="card">
              <ul className="inboxlist">
                {tickets.map((t) => (
                  <li key={t.id} className={t.status === "open" ? "unread" : undefined}>
                    <h2>{kindLabel(t.kind)}{t.kind === "help" ? `: ${reasonLabel(t.reason)}` : ""}</h2>
                    <span className="when">{longDate(t.created_at)} · {t.status === "open" ? "Open" : `Done${t.closed_at ? ` ${longDate(t.closed_at)}` : ""}`}</span>
                    <p>{t.message}</p>
                    {t.kind === "help" && accessOpen(t) && <p className="help">Kestrel can work in your clinic&apos;s account until {longDate(t.access_until as string)}. <Link href="/account/help">Take it back</Link></p>}
                  </li>
                ))}
              </ul>
              <p><Link href="/account/help" className="btn sm ghost">Send another</Link></p>
            </section>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
