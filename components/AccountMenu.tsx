import Link from "next/link";
import Icon from "@/components/Icon";
import { ACCOUNT_MENU, SETTINGS_HREF, initialsOf, type BarPerson } from "@/lib/account-menu";
import { signOut } from "@/lib/auth-actions";

// The initials badge with its menu (the name with a gear for account settings, the profile links, sign out) for a signed in person. Used by the dashboard bar and the public
// header, so it is the same everywhere. Opens with a click or the keyboard, using the browser's own details box.
export default function AccountMenu({ session, here, className = "" }: { session: BarPerson; here?: string; className?: string }) {
  return (
    <details className={`topbar-who ${className}`.trim()}>
      <summary aria-label={`Account menu for ${session.fullName || session.email}`}>
        <span className="avatar" aria-hidden="true">{initialsOf(session.fullName, session.email)}</span>
      </summary>
      <div className="who-panel">
        <div className="who-id">
          <div className="who-text">
            <p>{session.fullName || session.email}</p>
          </div>
          {session.role !== "admin" && (
            <Link href={SETTINGS_HREF} className="who-gear" aria-label="Account settings" aria-current={here === SETTINGS_HREF ? "page" : undefined}>
              <Icon name="gear" />
            </Link>
          )}
          {session.planLine && <Link href="/clinic/plans" className="who-plan">{session.planLine}</Link>}
        </div>
        {ACCOUNT_MENU[session.role].map((item) => (
          <Link key={item.href} href={item.href} aria-current={here === item.href ? "page" : undefined}>{item.label}</Link>
        ))}
        <form action={signOut}>
          <button type="submit" className="linkbtn">Sign out</button>
        </form>
      </div>
    </details>
  );
}
