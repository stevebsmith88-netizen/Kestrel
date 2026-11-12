import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { longDate } from "@/lib/jobs";
import { markAllRead } from "@/lib/notification-actions";
import { getMyNotifications } from "@/lib/notifications";

export const metadata: Metadata = { title: "Inbox | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// The in account inbox: short messages from Kestrel about what has happened on the account. One way only, nobody replies in it.
export default async function Inbox() {
  const session = await requireRole("candidate", "clinic");
  const items = await getMyNotifications();
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <>
      <AppBar session={session} current="/account/inbox" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Inbox</p>
          <h1>Your inbox</h1>
          <p className="lede2">Updates about your account, kept here as well as in your email. This is for reading only: to reach us, write to hello@eyecarejobs.ca.</p>
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
                    <h3>{n.title}</h3>
                    <span className="when">{longDate(n.created_at)}</span>
                    {n.body && <p>{n.body}</p>}
                    {n.href && <span className="actions"><Link href={n.href} className="btn sm ghost">Open</Link></span>}
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
