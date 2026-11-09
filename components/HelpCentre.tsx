import Link from "next/link";
import { Inline } from "@/components/BlogBody";
import HelpControls from "@/components/HelpControls";
import { HELP_OPEN_BY_DEFAULT, type HelpSection } from "@/lib/help";

// The help centre: 3 sections, each a native details box, and inside each one every topic is a details box too. General starts open and everything else starts closed.
// It works with the keyboard, with a screen reader and without JavaScript. HelpControls adds the search box, the deep link opening and the Expand all and Collapse all buttons.
export default function HelpCentre({ sections }: { sections: readonly HelpSection[] }) {
  return (
    <div id="help-root">
      <HelpControls />
      {sections.map((s) => (
        <details className="help-section" id={s.id} key={s.id} open={HELP_OPEN_BY_DEFAULT.includes(s.id)}>
          <summary>
            <span className="help-stitle">{s.title}</span>
            <span className="help-count">{s.topics.length} {s.topics.length === 1 ? "topic" : "topics"}</span>
          </summary>
          <div className="help-body">
            <p className="help-intro">{s.intro}</p>
            {s.topics.map((t) => (
              <details className="help-topic" id={t.id} key={t.id} data-keywords={t.keywords?.join(" ")}>
                <summary>{t.title}</summary>
                <div className="help-answer">
                  {t.answer.map((p, i) => <p key={i}><Inline text={p} sameDocument /></p>)}
                  {t.steps && t.steps.length > 0 && (
                    <ol className="help-steps">
                      {t.steps.map((step, i) => <li key={i}><Inline text={step} sameDocument /></li>)}
                    </ol>
                  )}
                  {t.links && t.links.length > 0 && (
                    <p className="help-links">
                      {t.links.map((l) => <Link key={l.href} href={l.href} className="btn sm ghost">{l.label}</Link>)}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
