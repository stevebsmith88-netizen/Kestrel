import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import { homeFor, type Session } from "@/lib/auth";

const HOME_LABEL = { candidate: "Home", clinic: "Dashboard", admin: "Overview" } as const;

// The bar across the top of every signed in page.
export default function AppBar({ session }: { session: Session }) {
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href={homeFor(session.role)} className="topbar-logo" aria-label="Kestrel Eye Care Jobs, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={132} height={39} />
        </Link>
        <nav aria-label="Main">
          <Link href={homeFor(session.role)} aria-current="page">{HOME_LABEL[session.role]}</Link>
        </nav>
        <div className="topbar-who">
          <span>{session.fullName || session.email}</span>
          <form action={signOut}>
            <button type="submit" className="linkbtn">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
