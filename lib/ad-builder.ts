"use server";

import { claudeClient } from "@/lib/anthropic-client";
import { requireRole } from "@/lib/auth";
import { STOCK_PHRASES, shapeFor, splitEarlier, websiteFacts } from "@/lib/ad-style";
import { getMyEmployer } from "@/lib/clinic";
import { clinicSiteText } from "@/lib/clinic-site";
import { practiceLabel, type JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

// Sonnet 5.5 writes a good ad at a fraction of the cost of the largest model. Set AD_BUILDER_MODEL in Vercel to try another
// (for example claude-haiku-5-5 for the lowest cost) without a code change.
const MODEL = process.env.AD_BUILDER_MODEL || "claude-sonnet-5-5";
const DAILY_LIMIT = 15;

const SYSTEM = `You write job ads for eye care clinics, suppliers and manufacturers in Canada, for a job board called Kestrel Eye Care Jobs.

Write one clear, warm, honest ad from the facts the clinic gives you.

Rules:
- Use only the facts you are given. Never invent benefits, pay, hours, years of experience, equipment, awards or anything else. If something is not in the brief, leave it out.
- Do not mention pay or salary. The pay range is shown separately on the job page.
- Never mention Canadian experience, local experience or experience working in Canada at all, not even to say it is not needed or not asked for. Kestrel refuses any post that contains those words. You may say internationally trained applicants are welcome, without that phrase.
- For field based roles, describe the area covered and the travel only if the facts say so. Never invent a territory, a vehicle, commission or a quota.
- Do not include email addresses, phone numbers or web addresses. Candidates apply through the job board.
- Do not use wording that points to age, such as "young", "energetic" or "digital native".
- Write in plain, warm British spelling with Canadian conventions (centre, organisation, colour). Use numerals (3, not three). Do not use em dashes, and do not use hyphens as punctuation: use commas or full stops.
- Sound like a colleague who knows eye care clinics. No recruiter cliches such as "rockstar", "fast paced environment" or "dynamic team". No hype.
- Avoid wording that reads as machine written. Never use: delve, tapestry, testament, vibrant, bespoke, robust, furthermore, intricate, leverage, pivot, utilise, showcase, bolster, foster, seamless, transformative, scalable, unlock, elevate, streamline, empower, journey. Do not write "not just X, but Y" or "rather than X, it does Y": say directly what the role or clinic is or does. Use plain verbs (is, has, does) instead of "serves as" or "functions as". Do not put 3 adjectives or 3 phrases in a row to sound impressive. Vary sentence length: mix short sentences with longer ones. No emoji. Use straight quotation marks.

Making it this clinic's own, and not like every other ad:
- Ask of every sentence: could any eye care clinic in Canada have posted it? If so, cut it or replace it with something specific from the facts. If the facts give nothing specific for a sentence, leave the sentence out. A shorter honest ad beats a padded one.
- Include at least 1 detail that could only belong to this clinic, if the facts hold one (a named piece of equipment, a kind of patient, a town, a real schedule detail, something the clinic said in its own words). Never invent one.
- Never use these or anything like them: ${STOCK_PHRASES.join(", ")}. Do not list values such as integrity, teamwork or excellence. Do not stack exclamation marks, and use at most 1 in the whole ad.
- Say what the person gets and does, more than what the clinic wants. State a competitive thing as a fact, or leave it out.
- You are given a way to open this particular ad. If you are also shown an earlier ad from this clinic for the same role, keep its facts, details and voice so the 2 match. If you are shown openings from its ads for other roles, do not repeat them.
- Use natural contractions (we're, you'll). Where the facts name a piece of equipment, a system or a technology, use its name, not a generic word.

Format: plain text only, with no markdown symbols (no #, *, or bullet characters). Use between 0 and 3 short headings, each on its own line with a blank line before it, and word the headings to fit this job and this ad. They need not be the same each time. Under each heading write short paragraphs. If there are no headings, write 3 to 5 short paragraphs.
Keep the whole ad between 100 and 300 words. Reply with the ad and nothing else.`;

const clip = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);

// Turns a clinic's few lines about a job into a draft ad. The clinic always reads and
// edits it before anything is submitted.
export async function buildAd(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("clinic");
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: "The ad builder is not switched on yet. You can write your ad by hand below." };

  const brief = clip(form, "brief", 1500);
  if (brief.length < 20) return { errors: { brief: "Tell us a little more about the job, in a few lines." }, error: "Tell us a little more about the job, in a few lines." };

  const admin = supabaseAdmin();
  if (!admin) return { error: "The ad builder is not available right now. You can write your ad by hand below." };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("ad_builder_uses").select("*", { count: "exact", head: true }).eq("user_id", session.userId).gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) return { error: "You have used the ad builder a lot today. Please try again tomorrow, or edit the ad you have." };
  await admin.from("ad_builder_uses").insert({ user_id: session.userId });

  const employer = await getMyEmployer(session.userId);
  // What this clinic has written before, so a new ad does not open the same way, and its own website for specifics. The clinic's
  // website is only read if the clinic gave one, and the ad is written without it if the site is slow or refuses.
  // The same clinic hiring for the same role again gets a matching ad. A different role gets a different way in.
  const role = clip(form, "roleCategory", 80);
  const { data: earlier } = employer ? await admin.from("jobs").select("description, role_category").eq("employer_id", employer.id).order("created_at", { ascending: false }).limit(8) : { data: null };
  const { sameRole, others } = splitEarlier((earlier ?? []) as { description: string | null; role_category: string | null }[], role);
  const site = websiteFacts(await clinicSiteText(employer?.website));
  const facts = [
    `Employer: ${employer?.clinic_name ?? "the employer"} (${practiceLabel(employer?.practice_type).toLowerCase()})`,
    clip(form, "workArrangement", 10) === "field" && `This is a field based role covering: ${clip(form, "territory", 200) || "an area the employer has not yet described"}`,
    clip(form, "payExtras", 300) && `Also part of the pay (mention it without giving any amounts): ${clip(form, "payExtras", 300)}`,
    clip(form, "title", 120) && `Job title: ${clip(form, "title", 120)}`,
    clip(form, "roleCategory", 80) && `Role: ${clip(form, "roleCategory", 80)}`,
    clip(form, "employmentType", 30) && `Employment type: ${clip(form, "employmentType", 30)}`,
    clip(form, "city", 80) && `Location: ${clip(form, "city", 80)}, ${clip(form, "province", 40)}`,
    employer?.about && `About the clinic: ${employer.about}`,
    `What the clinic told us about the job:\n${brief}`,
    site,
    `Way to open this ad: ${shapeFor(`${employer?.id ?? "none"}:${role}`)}`,
    sameRole ? `This clinic already has an ad for the same role, below. Keep the same facts, details, voice and way of opening so the 2 read as one clinic hiring for one job. Change only what this brief changes, and do not contradict it:\n<earlier_ad>\n${sameRole}\n</earlier_ad>` : "",
    others.length ? `Openings of this clinic's ads for other roles. Do not open this ad in a similar way:\n${others.map((o) => `- ${o}`).join("\n")}` : "",
  ].filter(Boolean).join("\n");

  try {
    const client = claudeClient(key);
    // Fallbacks keep a request from failing if the first model declines it.
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 3000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: facts }],
    });
    if (response.stop_reason === "refusal") return { error: "We couldn't write an ad from that. Please rephrase, or write it by hand below." };
    const text = response.content.filter((b) => b.type === "text").map((b) => ("text" in b ? b.text : "")).join("\n").trim();
    if (!text) return { error: "We couldn't write an ad this time. Please try again, or write it by hand below." };
    return { ad: text.replace(/\*\*/g, "").replace(/^#+\s*/gm, ""), message: "Here is a draft. Read it, change anything you like, and check every detail is right." };
  } catch (error) {
    console.error("Ad builder failed:", error instanceof Error ? error.message : error);
    return { error: "The ad builder had a problem. Please try again, or write your ad by hand below." };
  }
}
