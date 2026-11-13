// Run with: npm test
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// Audit P1-10. The public pages whose words only change with the code are saved once and shown to everyone, and job pages are saved for
// a few minutes. The hard rule: a saved page may never hold anything about the person viewing it. These checks read the code, since a
// page that reads the sign in, or a header that looks it up, is how that would happen. The headers themselves were checked on a running
// build (docs/audit/AUDIT-FIXES-LOG.md, P1-10).

const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8") : "");

const SAVED_PAGES = [
  "app/page.tsx",
  "app/blog/page.tsx",
  "app/blog/[slug]/page.tsx",
  "app/resources/page.tsx",
  "app/resources/ontario-job-ads/page.tsx",
  "app/compare/page.tsx",
  "app/clinics/page.tsx",
  "app/help/page.tsx",
  "app/privacy/page.tsx",
  "app/security/page.tsx",
  "app/terms/page.tsx",
  "app/posting-policy/page.tsx",
  "app/contact/page.tsx",
  "app/links/page.tsx",
  "app/eye-care-jobs/page.tsx",
  "app/eye-care-jobs/[province]/page.tsx",
  "app/eye-care-jobs/[province]/[role]/page.tsx",
  "app/jobs/[id]/page.tsx",
];
// Anything that would tell a page who is looking.
const PERSONAL = [/@\/lib\/auth"/, /@\/lib\/candidate"/, /next\/headers/, /\bcookies\(/, /\bconnection\(/, /getSession/, /requireRole/, /<SiteHeader[^>]*session=/];

test("the content pages and job pages are saved, and can never see who is visiting", () => {
  for (const page of SAVED_PAGES) {
    const src = read(page);
    assert.ok(src, `${page} is missing`);
    assert.match(src, /export const dynamic = "force-static";/, `${page} should be force-static`);
    assert.match(src, /export const revalidate = 300;/, `${page} should be rebuilt at most every 5 minutes`);
    for (const p of PERSONAL) assert.doesNotMatch(src, p, `${page} reads who is visiting (${p})`);
  }
});

test("the shared parts of a saved page never look up who is visiting", () => {
  for (const file of ["components/SiteHeader.tsx", "components/LandingView.tsx", "components/AppFooter.tsx", "components/AppBarView.tsx", "components/SessionBar.tsx", "app/layout.tsx"]) {
    const src = read(file);
    assert.ok(src, `${file} is missing`);
    for (const p of [/getSession/, /next\/headers/, /\bconnection\(/, /unreadCount/]) assert.doesNotMatch(src, p, `${file} looks up who is visiting (${p})`);
  }
});

test("the signed in bar on a saved page is drawn in the browser, from an answer that is never stored", () => {
  assert.match(read("components/SessionBar.tsx"), /fetch\("\/api\/me", \{ cache: "no-store"/);
  const me = read("app/api/me/route.ts");
  assert.match(me, /private, no-store/);
  assert.match(me, /export const dynamic = "force-dynamic";/);
});

test("pages that were not on the list stay built fresh for every visit", () => {
  for (const page of ["app/goodbye/page.tsx", "app/find-your-fit/page.tsx", "app/forgot-password/page.tsx", "app/jobs/page.tsx", "app/jobs/[id]/apply/page.tsx"]) {
    assert.match(read(page), /export const dynamic = "force-dynamic";/, `${page} should stay force-dynamic`);
  }
});

// Every file that changes a job or a clinic, or deletes an account (which takes a clinic's jobs with it), must clear the saved job pages.
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) && !name.includes(".test.") ? [path] : [];
  });
}

test("every change to a job or a clinic clears the saved job pages", () => {
  const writers = [...files("lib"), ...files("app")].filter((f) => /from\("(jobs|employers)"\)\s*\.(update|insert|delete|upsert)\(|auth\.admin\.deleteUser\(/.test(read(f)));
  assert.ok(writers.length >= 7, `expected to find the job writers, found ${writers.length}`);
  for (const f of writers) assert.match(read(f), /refreshJobPages\(\)/, `${f} changes jobs or clinics but never calls refreshJobPages()`);
  const helper = read("lib/job-cache.ts");
  assert.match(helper, /revalidatePath\("\/jobs\/\[id\]", "page"\)/);
  assert.match(helper, /revalidatePath\("\/"\)/, "the home page shows the latest jobs, so a job change clears it too");
  assert.match(helper, /revalidatePath\("\/eye-care-jobs", "layout"\)/);
});
