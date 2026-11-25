// A small "i" beside a word that opens a short explanation. It is a native details box, so it opens with a tap on a phone, a click or the
// keyboard, and needs no script. Hovering with a mouse shows the same words as a tooltip (the title). First used for "Fixed term" (Steve,
// 12th November 2026).
export default function InfoTip({ label, text }: { label: string; text: string }) {
  return (
    <details className="infotip">
      <summary title={text}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 11v6M12 7.4v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        <span className="sr">What {label} means</span>
      </summary>
      <span className="infotip-text">{text}</span>
    </details>
  );
}
