import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import LetterForm from "@/components/LetterForm";
import { requireRole } from "@/lib/auth";
import { wordCount } from "@/lib/applications";
import { deleteLetterTemplate } from "@/lib/letter-actions";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My saved letters | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Letter = { id: string; name: string; body: string };

export default async function Letters() {
  const session = await requireRole("candidate");
  const db = await supabaseServer();
  const { data } = db ? await db.from("cover_letter_templates").select("id, name, body").order("updated_at", { ascending: false }) : { data: null };
  const letters = (data ?? []) as Letter[];
  return (
    <>
      <AppBar session={session} current="/candidate/profile" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Your letters</p>
          <h1>My saved letters</h1>
          <p className="lede2">Keep up to 5 cover letters to start from. When you apply, pick one, then change it so it speaks to that clinic. Half finished letters are kept as drafts on each application.</p>
          <div className="stackcards">
            <section className="card">
              <h2>Saved letters</h2>
              {letters.length === 0 ? (
                <p className="help">You have none yet. Add one below, or tick &quot;Keep this letter&quot; when you apply.</p>
              ) : (
                <ul className="alertlist">
                  {letters.map((l) => (
                    <li key={l.id}>
                      <span>
                        <strong>{l.name}</strong> <span className="help">· {wordCount(l.body)} words</span>
                        <br /><span className="help">{l.body.slice(0, 120)}{l.body.length > 120 ? "…" : ""}</span>
                      </span>
                      <form action={deleteLetterTemplate}><input type="hidden" name="id" value={l.id} /><button type="submit" className="linkbtn">Delete</button></form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {letters.length < 5 && <LetterForm />}
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
