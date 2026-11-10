import Link from "next/link";
import { ACCOUNT_MENU, initialsOf } from "@/lib/account-menu";
import { signOut } from "@/lib/auth-actions";
import type { Session } from "@/lib/auth";

// The initials badge with its menu (profile, account settings, sign out) for a signed in person. Used by the dashboard bar and the public
// header, so it is the same everywhere. Opens with a click or the keyboard, using the browser's own details box.
export default function AccountMenu({ session, here, className = "" }: { session: Session; here?: string; className?: string }) {
  return (
    <details className={`topbar-who ${className}`.trim()}>
      <summary aria-label={`Account menu for ${session.fullName || session.email}`}>
        <span className="avatar" aria-hidden="true">{initialsOf(session.fullName, session.email)}</span>
      </summary>
      <div className="who-panel">
        <p>{session.fullName || session.email}</p>
        {session.fullName && <p className="who-email">{session.email}</p>}
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
