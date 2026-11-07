import Link from "next/link";

export default function AppFooter() {
  return (
    <footer>
      <div className="wrap">
        <span>
          <strong>Kestrel Eye Care Jobs</strong> &middot; eyecarejobs.ca
        </span>
        <span>
          <Link href="/eye-care-jobs">Jobs by province</Link> &middot; <Link href="/blog">Blog</Link> &middot; <Link href="/resources">Resources</Link> &middot; <Link href="/compare">Compare prices</Link> &middot; <Link href="/privacy">Privacy</Link> &middot; <Link href="/security">Security</Link> &middot; <Link href="/terms">Terms</Link> &middot; <Link href="/posting-policy">Posting policy</Link> &middot; <Link href="/contact">Contact</Link> &middot; &copy; {new Date().getFullYear()} Kestrel Eye Care Jobs
        </span>
      </div>
    </footer>
  );
}
