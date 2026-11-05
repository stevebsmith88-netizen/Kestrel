"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { claudeClient } from "@/lib/anthropic-client";
import { requireRole } from "@/lib/auth";
import { ALREADY_ON_KESTREL, clinicsAtSite } from "@/lib/found-db";
import { fetchPage } from "@/lib/fetch-page";
import type { JobFormState } from "@/lib/jobs";
import { PROVINCES, ROLE_CATEGORIES } from "@/lib/jobs";
import { largerTowns } from "@/lib/places";
import { SEARCHES_PER_DAY, jsonFromAnswer, leadWebsiteKey, normaliseLeads, validateLead, type Lead } from "@/lib/leads";
import { SEARCH_BLOCKED_DOMAINS, hostOfUrl, mentionsEyeRecommend, rankEmails, refuseAddress } from "@/lib/page-reader";
import { supabaseAdmin } from "@/lib/supabase-server";

// The province search (admin only): Claude's web search looks for eye care employers in a province that appear to be hiring, and
// reports each clinic's own website with what the page says about the job. The admin then reads the clinic's own careers page
// with the reader, finds a published contact email, and saves the clinic as a lead. Nothing is published and nobody is contacted.
// See docs/found-listings.md.

const MODEL = process.env.PAGE_READER_MODEL || "claude-sonnet-5-5";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type LeadView = Lead & { saved: boolean };
export type SearchState = JobFormState & { leads?: LeadView[]; dropped?: number; searched?: string };
export type EmailState = JobFormState & { emails?: { email: string; sourceUrl: string }[] };
export type LeadSaveState = JobFormState & { saved?: boolean };

const SYSTEM = `You help Kestrel Eye Care Jobs, a Canadian job board, find eye care employers that are hiring. Use web search to find them, then report what you found.

Find employers in the province you are given: optometry clinics, optical stores, ophthalmology and eye surgery clinics, and eye care groups, hiring for the roles you are given (or any eye care role if none is given). For each employer that appears to be hiring right now:
- clinic_name: the employer's name.
- website: the employer's OWN website home page (for example https://www.clinic.ca). Search for it if the result you found is not it. If you cannot find the employer's own website, leave the employer out. A job board page, a hiring system page (BambooHR, Workable, Lever and similar), a social network page or a directory page is not the employer's website.
- careers_url: the employer's own careers or jobs page, or its page on a hiring system, if you found one. Otherwise an empty string.
- job_title, role_category, employment_type: for the opening you found. role_category is the closest of the roles listed below, or an empty string. employment_type is Full time, Part time, Locum or Contract, only if stated.
- posted_text: when the opening was posted or its closing date, copied as the page states it (for example "Posted 3 days ago" or "Closes 30 November"). An empty string if the page gives no date. Never work one out.
- pay_as_written: the pay as the page words it, or an empty string. Never estimate pay. Ignore pay "estimates" from job boards.
- source_url: the web address where you saw the opening.
- city and province: where the job is. practice_type: independent, corporate (a chain, a retailer with an optical department, a large group) or supplier, or an empty string if you cannot tell.
- note: 1 short sentence if something needs checking (for example "page looks old"), otherwise an empty string.

Rules:
- Job board results (Workopolis, SimplyHired, Eluta, CareerBeacon and similar) can tell you that an employer is hiring. Use them only to learn the employer and the role, and then find the employer's own website. Do not copy a job board's wording.
- Never use or mention Indeed, LinkedIn or Jobs4ECPs, any college or association register, or anything about Eye Recommend. Leave out any employer whose only source is one of those.
- Only report openings that look current. Leave out openings marked closed or filled, and anything whose date is more than 90 days old.
- Do not guess or invent anything. Use only what the pages say. Do not give email addresses or phone numbers.
- Report up to 20 employers, the most clearly hiring first. Spread them over different towns and cities where you can.

Roles: ${ROLE_CATEGORIES.join("; ")}.

Reply with one JSON object and nothing else, in this form:
{"leads":[{"clinic_name":"","website":"","careers_url":"","job_title":"","role_category":"","employment_type":"","posted_text":"","pay_as_written":"","source_url":"","city":"","province":"","practice_type":"","note":""}]}`;

function describe(error: unknown) {
  if (error instanceof Anthropic.APIError) return `${error.status ?? "no status"}: ${String(error.message).replace(/sk-ant-[\w-]+/g, "[key]").slice(0, 240)}`;
  return error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240);
}

type Answer = { stop_reason: string | null; content: { type: string; text?: string }[] };

// Asks Claude with web search. A request that runs long can pause itself, in which case it is simply continued.
// The first way of asking is the best. If the API turns it down as invalid, simpler ways are tried.
async function searchWithClaude(key: string, request: string): Promise<string> {
  const client = claudeClient(key, { timeout: 110_000, maxRetries: 0 });
  const tool = (type: string) => ({ type, name: "web_search", max_uses: 8, blocked_domains: SEARCH_BLOCKED_DOMAINS, user_location: { type: "approximate", country: "CA" } });
  const ways: ((messages: { role: "user" | "assistant"; content: unknown }[]) => Promise<Answer>)[] = [
    (messages) => client.beta.messages.create({
      model: MODEL, max_tokens: 16000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default", output_config: { effort: "low" },
      system: SYSTEM, tools: [tool("web_search_20260209")], messages,
    } as never) as unknown as Promise<Answer>,
    (messages) => client.messages.create({ model: MODEL, max_tokens: 16000, system: SYSTEM, tools: [tool("web_search_20260209")], messages } as never) as unknown as Promise<Answer>,
    (messages) => client.messages.create({ model: MODEL, max_tokens: 16000, system: SYSTEM, tools: [tool("web_search_20250305")], messages } as never) as unknown as Promise<Answer>,
  ];
  let lastError: unknown = null;
  for (const way of ways) {
    try {
      const messages: { role: "user" | "assistant"; content: unknown }[] = [{ role: "user", content: request }];
      let answer: Answer | null = null;
      for (let turn = 0; turn < 4; turn++) {
        answer = await way(messages);
        if (answer.stop_reason !== "pause_turn") break;
        messages.push({ role: "assistant", content: answer.content });
      }
      if (!answer) continue;
      if (answer.stop_reason === "refusal") throw new SearchProblem("The search would not run for that request. Try a different province or role.");
      if (answer.stop_reason === "max_tokens") throw new SearchProblem("The search found too much to report at once. Try adding a city or a role.");
      return answer.content.map((b) => (b.type === "text" ? b.text ?? "" : "")).join("");
    } catch (error) {
      if (error instanceof SearchProblem) throw error;
      lastError = error;
      console.error("Province search failed:", describe(error));
      if (!(error instanceof Anthropic.BadRequestError)) break;
    }
  }
  if (lastError instanceof Anthropic.RateLimitError) throw new SearchProblem("The search is busy. Please try again in a minute.");
  if (lastError instanceof Anthropic.APIConnectionTimeoutError) throw new SearchProblem("The search took too long. Try adding a city or a role to narrow it.");
  if (lastError instanceof Anthropic.AuthenticationError) throw new SearchProblem("The Anthropic key in Vercel was not accepted. Check ANTHROPIC_API_KEY in this Vercel project, then redeploy.");
  const why = describe(lastError);
  if (/workspace/i.test(why)) throw new SearchProblem("The Anthropic key is not tied to a workspace. Make a key inside the Kestrel workspace, or add ANTHROPIC_WORKSPACE_ID in Vercel, then redeploy.");
  if (/web.?search/i.test(why)) throw new SearchProblem(`Web search is not switched on for your Anthropic account yet. Turn it on in the Anthropic console's settings, then try again (${why}).`);
  throw new SearchProblem(`The search had a problem talking to Claude (${why}).`);
}

class SearchProblem extends Error {}

// The larger towns of a province, for searching it town by town (the admin page asks for these, then searches each in turn).
export async function townsToSearch(province: string): Promise<string[]> {
  await requireRole("admin");
  return (PROVINCES as readonly string[]).includes(province) ? largerTowns(province) : [];
}

export async function searchProvince(_prev: SearchState, form: FormData): Promise<SearchState> {
  const session = await requireRole("admin");
  const province = String(form.get("province") ?? "");
  const role = String(form.get("role") ?? "");
  const city = String(form.get("city") ?? "").replace(/[^\p{L}\p{N} .'-]/gu, "").trim().slice(0, 60);
  if (!(PROVINCES as readonly string[]).includes(province)) return { errors: { province: "Choose a province or territory." }, error: "Choose a province or territory." };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: "The search needs ANTHROPIC_API_KEY in Vercel, the same key the ad builder uses." };
  const db = supabaseAdmin();
  if (!db) return { error: "The database is not connected, so the search cannot run." };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await db.from("page_reads").select("id", { count: "exact", head: true }).eq("read_by", session.userId).like("url", "search:%").gte("read_at", since);
  if (countError) return { error: "The search needs database migration 0023. Run it in Supabase, then try again." };
  if ((count ?? 0) >= SEARCHES_PER_DAY) return { error: `You have run ${SEARCHES_PER_DAY} searches today, which is the daily limit. Please carry on tomorrow.` };

  const label = [province, city, (ROLE_CATEGORIES as readonly string[]).includes(role) ? role : "any role"].filter(Boolean).join(", ");
  const record = (jobs_found: number, outcome: "read" | "failed", reason?: string) =>
    db.from("page_reads").insert({ read_by: session.userId, url: `search: ${label}`.slice(0, 600), outcome, jobs_found, reason: reason?.slice(0, 400) ?? null });
  const request = `Province: ${province}${city ? `\nCity or area: ${city}` : ""}\nRoles: ${(ROLE_CATEGORIES as readonly string[]).includes(role) ? role : "any eye care role"}\nToday's date: ${new Date().toISOString().slice(0, 10)}`;

  let answer: string;
  try {
    answer = await searchWithClaude(key, request);
  } catch (error) {
    const message = error instanceof SearchProblem ? error.message : "The search had a problem. Please try again.";
    await record(0, "failed", message);
    return { error: message };
  }
  const { leads, dropped } = normaliseLeads(jsonFromAnswer(answer), province);

  // Leave out clinics that already have their own Kestrel account, and mark the ones already saved.
  const keep: LeadView[] = [];
  const { data: savedRows } = await db.from("clinic_leads").select("website_key").in("website_key", leads.map((l) => leadWebsiteKey(l.website)).filter(Boolean));
  const saved = new Set((savedRows ?? []).map((r) => r.website_key as string));
  let onKestrel = 0;
  for (const lead of leads) {
    if ((await clinicsAtSite(db, lead.website)).some((c) => c.claimed || c.owner_id)) {
      onKestrel += 1;
      continue;
    }
    keep.push({ ...lead, saved: saved.has(leadWebsiteKey(lead.website)) });
  }
  await record(keep.length, "read");
  revalidatePath("/admin/found");
  if (!keep.length) return { leads: [], dropped, searched: label, message: "Nothing usable came back. Try a city, or a role, or search again in a few minutes." };
  return {
    leads: keep,
    dropped: dropped + onKestrel,
    searched: label,
    message: `${keep.length} ${keep.length === 1 ? "clinic" : "clinics"} that look like they are hiring. Dates and pay are only shown when the page says them.`,
  };
}

const PAUSE = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Looks for a published contact email on a clinic's own website: its home page, and if that has none worth using, the usual
// contact and about pages. Reads only (1 page at a time, robots.txt obeyed). Addresses come from the pages' own words and
// mailto links, never guessed, and each is returned with the page it was published on.
export async function findContactEmails(_prev: EmailState, form: FormData): Promise<EmailState> {
  await requireRole("admin");
  let origin = "";
  try {
    origin = new URL(String(form.get("website") ?? "")).origin;
  } catch {
    return { error: "That clinic has no website to look on." };
  }
  const refused = refuseAddress(origin);
  if (refused) return { error: refused };
  const extra = String(form.get("careersUrl") ?? "");
  const tryPages = [origin, ...(extra && !refuseAddress(extra) && hostOfUrl(extra) === hostOfUrl(origin) ? [extra] : []), `${origin}/contact`, `${origin}/contact-us`, `${origin}/about`, `${origin}/about-us`];
  const found = new Map<string, string>();
  const host = hostOfUrl(origin);
  let looked = 0;
  for (const address of tryPages) {
    if (looked >= 5) break;
    if (looked > 0) await PAUSE(600);
    const fetched = await fetchPage(address);
    looked += 1;
    if (!fetched.ok) {
      if (looked === 1) return { error: fetched.reason };
      continue;
    }
    const { page, url } = fetched;
    if ([page.title, page.text, ...page.links.map((l) => l.url)].some(mentionsEyeRecommend)) return { error: "This website mentions Eye Recommend. Kestrel keeps clear of anything connected with Eye Recommend, so this clinic is skipped." };
    for (const email of page.emails) if (!found.has(email)) found.set(email, url);
    const good = rankEmails([...found.keys()], host).filter((e) => /career|job|hr|recruit|hiring|resume|employment|talent/i.test(e.split("@")[0]) || e.endsWith(`@${host.replace(/^www\./, "")}`));
    if (good.length) break;
  }
  const emails = rankEmails([...found.keys()], host).slice(0, 5).map((email) => ({ email, sourceUrl: found.get(email) ?? origin }));
  if (!emails.length) return { emails: [], message: "No email address is published on the clinic's home or contact pages. Use the contact form on their website, or leave it for now." };
  return { emails, message: emails.length === 1 ? "1 published address found." : `${emails.length} published addresses found, best first.` };
}

const field = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function saveLead(_prev: LeadSaveState, form: FormData): Promise<LeadSaveState> {
  const session = await requireRole("admin");
  const db = supabaseAdmin();
  if (!db) return { error: "The database is not connected." };
  const lead = {
    clinicName: field(form, "clinicName", 160),
    website: field(form, "website", 300),
    province: field(form, "province", 40),
    contactEmail: field(form, "contactEmail", 254).toLowerCase(),
    emailSourceUrl: field(form, "emailSourceUrl", 500),
  };
  const errors = validateLead(lead);
  if (Object.keys(errors).length) return { errors, error: Object.values(errors)[0] };
  if ((await clinicsAtSite(db, lead.website)).some((c) => c.claimed || c.owner_id)) return { error: ALREADY_ON_KESTREL };
  const now = new Date().toISOString();
  const row = {
    added_by: session.userId,
    clinic_name: lead.clinicName,
    website: new URL(lead.website).origin,
    website_key: leadWebsiteKey(lead.website),
    city: field(form, "city", 80) || null,
    province: lead.province,
    practice_type: ["independent", "corporate", "supplier"].includes(field(form, "practiceType", 20)) ? field(form, "practiceType", 20) : null,
    careers_url: field(form, "careersUrl", 500) || null,
    job_title: field(form, "jobTitle", 120) || null,
    role_category: field(form, "roleCategory", 80) || null,
    posted_text: field(form, "postedText", 60) || null,
    pay_as_written: field(form, "payAsWritten", 120) || null,
    source_url: field(form, "sourceUrl", 500) || null,
    source_kind: ["own_site", "hiring_system", "job_board"].includes(field(form, "source", 20)) ? field(form, "source", 20) : null,
    note: field(form, "note", 300) || null,
    updated_at: now,
    // A saved email always carries the page it came from and when. Saving again without one keeps what was already there.
    ...(lead.contactEmail ? { contact_email: lead.contactEmail, email_source_url: lead.emailSourceUrl, email_found_at: now } : {}),
  };
  const { error } = await db.from("clinic_leads").upsert(row, { onConflict: "website_key" });
  if (error) {
    console.error("Saving a lead failed:", error.code, error.message);
    return { error: error.code === "42P01" ? "Leads need database migration 0025. Run it in Supabase, then try again." : "We couldn't save that lead. Please try again." };
  }
  revalidatePath("/admin/found");
  return { saved: true, message: "Saved to your leads." };
}

export async function setLeadStatus(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  const db = supabaseAdmin();
  if (!UUID.test(id) || !db) return;
  if (status === "remove") await db.from("clinic_leads").delete().eq("id", id);
  else if (["new", "listed", "skipped"].includes(status)) await db.from("clinic_leads").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/found");
}
