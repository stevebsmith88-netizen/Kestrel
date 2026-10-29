import Link from "next/link";

export default function AppFooter() {
  return (
    <footer>
      <div className="wrap">
        <span>
          <strong>Kestrel Eye Care Jobs</strong> &middot; eyecarejobs.ca
        </span>
        <span>
          <Link href="/privacy">Privacy policy</Link> &middot; &copy; {new Date().getFullYear()} Kestrel Eye Care Jobs
        </span>
      </div>
    </footer>
  );
}
