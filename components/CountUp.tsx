import { formatCount } from "@/lib/eye-care-numbers";

// A figure on the home page. It no longer counts up from 0 (20th November 2026): an AI assistant read the page part way
// through the count and quoted 869 and 1,557 instead of 6,400 and 11,700. The real figure is now the only text in the page,
// so a search engine, an assistant, a screen reader and a person all see the same number straight away.
// The name stays so the home page does not change; the `duration` prop is kept for the same reason and does nothing.
export default function CountUp({ to, suffix = "" }: { to: number; suffix?: string; duration?: number }) {
  return (
    <span>
      {formatCount(to)}
      {suffix}
      {suffix === "+" ? <span className="sr"> or more</span> : null}
    </span>
  );
}
