// The rules for reading one public web page, kept apart from the network so they can be tested (lib/page-reader.test.ts).
// The fetching itself is in lib/fetch-page.ts. Used by the found listings tool, and later by the ad builder's
// "paste your job link" box, so both read pages the same way.
//
// What the rules say, in plain English:
//  * Kestrel only reads a clinic's own website. Job boards, recruiters, social networks and the professional
//    colleges are refused by name (CLAUDE.md: no scraping of Indeed, LinkedIn, Jobs4ECPs or the college registers).
//  * Anything connected with Eye Recommend is refused (CLAUDE.md: separation from Eye Recommend).
//  * A site's robots.txt is obeyed.
//  * The page is turned into plain text, with any structured job data the page carries for search engines.

export const READER_AGENT = "KestrelEyeCareJobs";
export const READER_USER_AGENT = `${READER_AGENT}/1.0 (+https://eyecarejobs.ca/contact; reads one clinic careers page when a person asks)`;

// Sites Kestrel never reads, and never uses even to find clinics (CLAUDE.md, Non negotiables): Indeed, LinkedIn, Jobs4ECPs and the
// college registers. Matched on the host and every subdomain of it (ca.indeed.com matches indeed.com).
const NEVER_BOARDS = ["indeed.com", "indeed.ca", "linkedin.com", "lnkd.in", "jobs4ecps.com", "jobs4ecps.ca", "eyecarejobs.ca"];
// Other job boards. Kestrel does not copy their ads, so a board page is never read as the source of a listing. A search result
// from one of them can still tell us a clinic is hiring, and the clinic's own website is then found separately.
const OTHER_BOARDS = [
  "glassdoor.com", "glassdoor.ca", "glassdoor.co.uk", "ziprecruiter.com", "ziprecruiter.ca", "monster.com", "monster.ca", "workopolis.com",
  "simplyhired.com", "simplyhired.ca", "talent.com", "neuvoo.ca", "neuvoo.com", "jooble.org", "eluta.ca", "jobillico.com", "jobboom.com",
  "careerbeacon.com", "jobbank.gc.ca", "guichetemplois.gc.ca", "kijiji.ca", "craigslist.org", "jobs.ca", "careerjet.ca", "adzuna.ca",
  "wowjobs.ca", "workink.com", "hiringcafe.com", "builtin.com", "wellfound.com", "canadajobs.works", "jobs.eyesoneyecare.com", "opto.ca",
];
const SOCIAL = ["facebook.com", "fb.com", "instagram.com", "x.com", "twitter.com", "tiktok.com", "youtube.com", "reddit.com", "threads.net"];
// The professional colleges and associations. Their registers and job boards are not clinic careers pages.
const COLLEGES = [
  "collegeoptom.on.ca", "coptont.org", "ooq.org", "ooodq.qc.ca", "chcpbc.org", "opticians.ca", "optom.on.ca",
  "optometrists.ab.ca", "albertaopticians.ca", "optometrists.sk.ca",
];
const EYE_RECOMMEND = ["eyerecommend.ca", "eyerecommend.com"];

// Hosted careers pages that belong to one employer (an applicant tracking system). These are allowed, because the page is
// the clinic's own, but the host is not the clinic's website, so the tool asks for the website separately.
export const HIRING_SYSTEMS = [
  "workable.com", "bamboohr.com", "lever.co", "greenhouse.io", "myworkdayjobs.com", "workday.com", "applytojob.com", "breezy.hr",
  "recruitee.com", "jobvite.com", "icims.com", "smartrecruiters.com", "dayforcehcm.com", "ultipro.com", "ultipro.ca", "ukg.com",
  "hiringthing.com", "adp.com", "paycomonline.net", "teamtailor.com", "pinpointhq.com", "ashbyhq.com", "careers-page.com",
  "zohorecruit.com", "zohorecruit.ca", "jazzhr.com", "rippling.com", "personio.com", "freshteam.com", "trakstar.com",
];

const onList = (host: string, list: readonly string[]) => list.some((d) => host === d || host.endsWith(`.${d}`));

// Hosts the province search must never use, even as a lead: the 3 named boards, the colleges, social networks and Eye Recommend.
export const SEARCH_BLOCKED_DOMAINS: string[] = [...NEVER_BOARDS.filter((d) => d !== "eyecarejobs.ca"), ...SOCIAL, ...COLLEGES, ...EYE_RECOMMEND];
export const isOtherJobBoard = (host: string) => onList(host, OTHER_BOARDS);
export const isNeverHost = (host: string) => onList(host, NEVER_BOARDS) || onList(host, SOCIAL) || onList(host, COLLEGES) || onList(host, EYE_RECOMMEND);

export const hostOfUrl = (value: string) => {
  try {
    return new URL(value).hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const isHiringSystem = (host: string) => onList(host, HIRING_SYSTEMS);

// The part of a host that names the clinic's site: harbourside.ca for www.harbourside.ca and careers.harbourside.ca, and
// clinic.on.ca for a site under a provincial address such as careers.clinic.on.ca. On a website builder each clinic has its
// own subdomain (harbourside.wixsite.com), so the whole host is kept. A site that is told apart only by its path
// (sites.google.com/view/...) gets no key, so it is never matched with another clinic.
const PROVINCIAL = /\.(ab|bc|mb|nb|nl|ns|nt|nu|on|pe|qc|sk|yk|yt)\.ca$/;
const BUILDERS = [
  "wixsite.com", "squarespace.com", "weebly.com", "godaddysites.com", "business.site", "wordpress.com", "myshopify.com", "carrd.co",
  "square.site", "webflow.io", "netlify.app", "vercel.app", "github.io", "blogspot.com", "jimdosite.com", "site123.me", "mystrikingly.com",
];
const PATH_SITES = ["sites.google.com"];
export function siteKey(host: string) {
  const bare = host.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  if (onList(bare, PATH_SITES) || onList(bare, HIRING_SYSTEMS)) return "";
  if (BUILDERS.some((b) => bare.endsWith(`.${b}`))) return bare;
  const labels = bare.split(".").filter(Boolean);
  return labels.slice(PROVINCIAL.test(`.${labels.join(".")}`) ? -3 : -2).join(".");
}

// Checks a web address before anything is fetched. Returns the reason it is refused, or null if it may be read.
export function refuseAddress(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "Enter the full web address of the careers page, starting with https://.";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "Enter a web address starting with https://.";
  if (url.username || url.password) return "That web address has a user name or password in it. Copy the address of the page itself.";
  if (url.port && url.port !== "443" && url.port !== "80") return "That web address uses an unusual port. Copy the address of the page itself.";
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return "That is not a public website.";
  }
  if (/^[\d.]+$/.test(host) || host.includes(":") || host.startsWith("[")) return "Use the clinic's web address, not a number address.";
  const bare = host.replace(/^www\./, "");
  if (onList(bare, EYE_RECOMMEND)) return "Kestrel keeps clear of anything connected with Eye Recommend, so this page is not read.";
  if (onList(bare, NEVER_BOARDS)) return "Kestrel never reads Indeed, LinkedIn or Jobs4ECPs, in any way. Use the clinic's own website.";
  if (onList(bare, OTHER_BOARDS)) return "That is a job board. Kestrel does not copy ads from job boards. Use the clinic's own website, which the search can help you find.";
  if (onList(bare, SOCIAL)) return "That is a social network. Use the careers page on the clinic's own website.";
  if (onList(bare, COLLEGES)) return "That is a professional college or association. Kestrel never reads college registers or association job boards.";
  return null;
}

// True when an address belongs to a private or reserved network, so the reader can never be pointed inside our own systems.
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) {
    const [a, b] = v4.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === "::" || v6 === "::1" || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || v6.startsWith("ff") || v6.startsWith("64:ff9b:") || v6.startsWith("2001:db8");
}

// Reads robots.txt the way search engines do (RFC 9309): the group for our name if there is one, otherwise the group for
// everyone, and the longest matching rule wins, with Allow winning a tie. Supports * and $ in rules.
export function robotsAllows(robotsTxt: string, path: string, agent = READER_AGENT): boolean {
  type Group = { agents: string[]; rules: { allow: boolean; pattern: string }[] };
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const field = match[1].toLowerCase();
    const value = match[2].trim();
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((field === "allow" || field === "disallow") && current) {
      lastWasAgent = false;
      if (value) current.rules.push({ allow: field === "allow", pattern: value });
    } else {
      lastWasAgent = false;
    }
  }
  const name = agent.toLowerCase();
  const ours = groups.filter((g) => g.agents.some((a) => a !== "*" && name.startsWith(a)));
  const chosen = ours.length ? ours : groups.filter((g) => g.agents.includes("*"));
  const rules = chosen.flatMap((g) => g.rules);
  let best: { allow: boolean; length: number } | null = null;
  for (const rule of rules) {
    if (!ruleMatches(rule.pattern, path)) continue;
    const length = rule.pattern.length;
    if (!best || length > best.length || (length === best.length && rule.allow)) best = { allow: rule.allow, length };
  }
  return best ? best.allow : true;
}

function ruleMatches(pattern: string, path: string) {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern).split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`).test(path);
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", ndash: "-", mdash: "-", hyphen: "-", rsquo: "'", lsquo: "'",
  rdquo: "\"", ldquo: "\"", hellip: "...", bull: "-", middot: "-", copy: "(c)", reg: "(r)", trade: "(tm)", dollar: "$",
  eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", agrave: "à", acirc: "â", ccedil: "ç", icirc: "î", iuml: "ï", ocirc: "ô",
  ucirc: "û", ugrave: "ù", Eacute: "É", Egrave: "È", Agrave: "À", Ccedil: "Ç", laquo: "\"", raquo: "\"", times: "x",
};

export function decodeEntities(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      if (!Number.isFinite(n) || n <= 0 || n > 0x10ffff) return " ";
      if (n === 0x2013 || n === 0x2014) return "-";
      if (n === 0x2018 || n === 0x2019) return "'";
      if (n === 0x201c || n === 0x201d) return "\"";
      if (n === 0xa0) return " ";
      return String.fromCodePoint(n);
    }
    return ENTITIES[code] ?? whole;
  });
}

const stripTags = (html: string) => decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

export type PageLink = { text: string; url: string };
export type ReadPage = { title: string; text: string; links: PageLink[]; structured: string[]; emails: string[]; truncated: boolean };

export const MAX_TEXT = 60_000;
const LINK_WORDS = /apply|career|job|position|vacanc|opening|join|hiring|application|resume|employment|emploi|carri|postuler/i;

// Turns a page into what the reader needs: its title, its words, the links that look like application links, and any
// structured job data (JobPosting) the page gives search engines. Scripts, styles and hidden templates are dropped.
export function readHtml(fullHtml: string, pageUrl: string): ReadPage {
  // Careers pages are far smaller than this. The limit keeps a broken or enormous page from slowing the reader down.
  const html = fullHtml.slice(0, 2_000_000);
  const title = stripTags(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "").slice(0, 200);

  const structured: string[] = [];
  for (const m of html.matchAll(/<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      for (const posting of jobPostingsIn(JSON.parse(m[1].trim()))) structured.push(posting);
    } catch {
      // Broken structured data is common and harmless. The page text is still read.
    }
    if (structured.length >= 10) break;
  }

  const links: PageLink[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = decodeEntities((m[1] ?? m[2] ?? m[3] ?? "").trim());
    const text = stripTags(m[4]).slice(0, 120);
    if (!href || href.startsWith("#") || /^(javascript|mailto|tel):/i.test(href)) continue;
    if (!LINK_WORDS.test(text) && !LINK_WORDS.test(href)) continue;
    let url: string;
    try {
      const u = new URL(href, pageUrl);
      if (u.protocol !== "https:" && u.protocol !== "http:") continue;
      u.hash = "";
      url = u.toString();
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    links.push({ text, url });
    if (links.length >= 60) break;
  }

  let body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg|iframe|head|select|canvas)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/li\s*>/gi, "")
    .replace(/<(br|hr)\b[^>]*>/gi, "\n")
    .replace(/<\/?(p|div|ul|ol|h[1-6]|tr|table|section|article|header|footer|main|aside|nav|dl|dt|dd|blockquote|pre|form|fieldset|figure|figcaption|address)\b[^>]*>/gi, "\n")
    .replace(/<\/?(td|th)\b[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, " ");
  body = decodeEntities(body)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
    .filter((line, i, all) => line !== "" || (i > 0 && all[i - 1] !== ""))
    .join("\n")
    .trim();
  const truncated = body.length > MAX_TEXT;
  return { title, text: truncated ? body.slice(0, MAX_TEXT) : body, links, structured, emails: emailsIn(html), truncated };
}

// Finds JobPosting objects in structured data, including inside @graph lists, and writes each as short plain lines.
function jobPostingsIn(value: unknown, depth = 0): string[] {
  if (!value || typeof value !== "object" || depth > 4) return [];
  if (Array.isArray(value)) return value.flatMap((v) => jobPostingsIn(v, depth + 1));
  const obj = value as Record<string, unknown>;
  const type = obj["@type"];
  const isPosting = type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
  if (!isPosting) return jobPostingsIn(obj["@graph"], depth + 1);
  const flat = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "string") return stripTags(v);
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return v.map(flat).filter(Boolean).join(", ");
    if (typeof v === "object") return Object.entries(v as Record<string, unknown>).filter(([k]) => !k.startsWith("@")).map(([k, x]) => `${k}: ${flat(x)}`).filter((s) => !s.endsWith(": ")).join("; ");
    return "";
  };
  const fields = ["title", "employmentType", "datePosted", "validThrough", "hiringOrganization", "jobLocation", "baseSalary", "estimatedSalary", "url", "description"];
  return [fields.map((f) => (obj[f] == null ? "" : `${f}: ${flat(obj[f]).slice(0, f === "description" ? 3000 : 300)}`)).filter(Boolean).join("\n")];
}

// True when the page mentions Eye Recommend in its words or its links. Such a page is never used.
export const mentionsEyeRecommend = (text: string) => /eye\s*-?\s*recommend/i.test(text);

// Copy check. A found listing is written in our own words: facts can be repeated, wording cannot. The page is kept only as
// a set of numbers, one for every run of 8 words, so its wording is never stored. A summary that shares any 8 word run
// with the page is sent back to be reworded.
export const COPY_RUN = 8;
const wordsOf = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9$]+/).filter(Boolean);

function hashWords(words: string[]) {
  let h = 0x811c9dc5;
  const s = words.join(" ");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h | 0;
}

export function fingerprint(text: string, limit = 40_000): number[] {
  const words = wordsOf(text);
  const out = new Set<number>();
  for (let i = 0; i + COPY_RUN <= words.length && out.size < limit; i++) out.add(hashWords(words.slice(i, i + COPY_RUN)));
  return [...out];
}

// The first run of 8 words in `text` that also appears on the page, or null.
export function copiedRun(text: string, pagePrint: Iterable<number>): string | null {
  const page = pagePrint instanceof Set ? pagePrint : new Set(pagePrint);
  const words = wordsOf(text);
  for (let i = 0; i + COPY_RUN <= words.length; i++) {
    const run = words.slice(i, i + COPY_RUN);
    if (page.has(hashWords(run))) return run.join(" ");
  }
  return null;
}

// Careers page finder. From a clinic's home page, the links most likely to lead to its careers or jobs page, best first.
// Only links on the clinic's own site or on a hiring system count. Job boards and other sites are left out.
const CAREERS_TEXT = /career|join (our|the) team|work (with|for) us|employment|\bjobs?\b|hiring|opportunit|vacanc|emplois?|carri[eè]re|recrut|nous joindre/i;
const CAREERS_PATH = /career|\bjobs?\b|join|employment|hiring|vacanc|emploi|carriere|recrut/i;
export const COMMON_CAREERS_PATHS = ["/careers", "/jobs", "/join-our-team", "/employment"];

export function careersLinks(page: Pick<ReadPage, "links">, siteUrl: string, limit = 5): PageLink[] {
  const home = siteKey(hostOfUrl(siteUrl));
  const scored = page.links
    .map((link) => {
      const host = hostOfUrl(link.url);
      const hiring = isHiringSystem(host);
      if (refuseAddress(link.url) || (!hiring && siteKey(host) !== home)) return null;
      let path = "";
      try {
        path = new URL(link.url).pathname;
      } catch {
        return null;
      }
      const score = (CAREERS_TEXT.test(link.text) ? 3 : 0) + (CAREERS_PATH.test(path) ? 2 : 0) + (hiring ? 2 : 0) - (/apply|postuler/i.test(path) ? 1 : 0);
      return score > 0 ? { link, score } : null;
    })
    .filter((x): x is { link: PageLink; score: number } => x !== null);
  scored.sort((a, b) => b.score - a.score || a.link.url.length - b.link.url.length);
  return scored.slice(0, limit).map((x) => x.link);
}

// Turns what a person types ("harbourside.ca", "www.harbourside.ca/") into a web address to start from.
export function startAddress(typed: string) {
  const value = typed.trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
}

// Email addresses a page publishes, from its own mailto links and its words. Read from the page only, never guessed.
// Addresses that are plainly not a person to write to (images, website builders, placeholders, no reply) are left out.
const EMAIL_AT = /[a-z0-9][a-z0-9._%+-]{0,63}@[a-z0-9][a-z0-9.-]{0,251}\.[a-z]{2,24}/gi;
const NOT_REAL_EMAIL = /\.(png|jpe?g|gif|webp|svg|css|js|ico|woff2?)$|@(sentry|wixpress|sentry-next|example|domain|yourdomain|email|test|schema|w3|cloudflare|googleapis|gstatic)\.|^(noreply|no-reply|donotreply|do-not-reply|name|your|user|username|email|someone|mail)@/i;
export const GENERIC_BUSINESS_PARTS = /^(info|contact|hello|admin|office|reception|frontdesk|appointments|booking|bookings|team|clinic|support|enquiries|inquiries|general)$/i;
const HIRING_PARTS = /career|job|hr$|^hr|recruit|hiring|resume|employment|talent|people/i;

export function emailsIn(html: string): string[] {
  const text = decodeEntities(html.replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ").replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ").replace(/%40/gi, "@"));
  const found = new Set<string>();
  for (const m of text.matchAll(EMAIL_AT)) {
    const address = m[0].toLowerCase().replace(/[.]+$/, "");
    if (!NOT_REAL_EMAIL.test(address)) found.add(address);
    if (found.size >= 30) break;
  }
  return [...found];
}

// Orders addresses for someone looking for where to write about hiring: hiring words first, then an address at the clinic's own
// website, then the clinic's general addresses (info@, contact@), then anything else.
export function rankEmails(emails: string[], siteHost: string): string[] {
  const key = siteKey(siteHost);
  const score = (e: string) => {
    const [local, domain] = e.split("@");
    return (HIRING_PARTS.test(local) ? 4 : 0) + (key && siteKey(domain) === key ? 2 : 0) + (GENERIC_BUSINESS_PARTS.test(local) ? 1 : 0);
  };
  return [...emails].sort((a, b) => score(b) - score(a) || a.localeCompare(b));
}
