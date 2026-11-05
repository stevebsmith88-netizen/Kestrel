// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { copiedRun, decodeEntities, fingerprint, isHiringSystem, isPrivateAddress, mentionsEyeRecommend, readHtml, refuseAddress, robotsAllows, siteKey } from "./page-reader.ts";

test("job boards, social networks, colleges and Eye Recommend are never read", () => {
  for (const url of [
    "https://ca.indeed.com/viewjob?jk=123",
    "https://www.linkedin.com/jobs/view/1",
    "https://jobs4ecps.com/job/1",
    "https://www.glassdoor.ca/job-listing/x",
    "https://www.jobbank.gc.ca/jobsearch/jobposting/1",
    "https://www.facebook.com/someclinic/jobs",
    "https://www.collegeoptom.on.ca/find-an-optometrist",
    "https://www.coptont.org/register",
    "https://eyerecommend.ca/find-a-clinic",
    "https://members.eyerecommend.com/",
  ]) {
    assert.ok(refuseAddress(url), url);
  }
  assert.match(refuseAddress("https://eyerecommend.ca/")!, /Eye Recommend/);
});

test("a clinic's own careers page, or its page on a hiring system, can be read", () => {
  for (const url of ["https://www.harbourside.ca/careers", "http://maplegroveeyecare.com/jobs/optician", "https://harbourside.bamboohr.com/careers/12", "https://apply.workable.com/harbourside/j/ABC/"]) {
    assert.equal(refuseAddress(url), null, url);
  }
  assert.equal(isHiringSystem("harbourside.bamboohr.com"), true);
  assert.equal(isHiringSystem("harbourside.ca"), false);
});

test("addresses that are not public websites are refused", () => {
  for (const url of ["ftp://clinic.ca/jobs", "https://localhost/jobs", "https://192.168.1.10/jobs", "https://[::1]/", "https://intranet/jobs", "https://user:pw@clinic.ca/", "https://clinic.ca:8443/jobs", "not a link"]) {
    assert.ok(refuseAddress(url), url);
  }
  assert.equal(isPrivateAddress("10.0.0.5"), true);
  assert.equal(isPrivateAddress("172.20.1.1"), true);
  assert.equal(isPrivateAddress("169.254.169.254"), true);
  assert.equal(isPrivateAddress("127.0.0.1"), true);
  assert.equal(isPrivateAddress("::1"), true);
  assert.equal(isPrivateAddress("fd12::1"), true);
  assert.equal(isPrivateAddress("::ffff:192.168.0.1"), true);
  assert.equal(isPrivateAddress("142.250.80.46"), false);
  assert.equal(isPrivateAddress("2607:f8b0:4005::200e"), false);
});

test("robots.txt is obeyed: our own group first, the longest rule wins, Allow wins a tie", () => {
  const robots = "User-agent: *\nDisallow: /private/\nAllow: /private/careers\n\nUser-agent: BadBot\nDisallow: /\n";
  assert.equal(robotsAllows(robots, "/careers"), true);
  assert.equal(robotsAllows(robots, "/private/staff"), false);
  assert.equal(robotsAllows(robots, "/private/careers/optician"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /\n", "/careers"), false);
  assert.equal(robotsAllows("User-agent: *\nDisallow:\n", "/careers"), true);
  assert.equal(robotsAllows("", "/careers"), true);
  // A group just for us replaces the group for everyone.
  assert.equal(robotsAllows("User-agent: *\nDisallow: /\n\nUser-agent: KestrelEyeCareJobs\nAllow: /careers\nDisallow: /\n", "/careers"), true);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /\n\nUser-agent: KestrelEyeCareJobs\nAllow: /careers\nDisallow: /\n", "/about"), false);
  // Several agents can share one group, and * and $ work.
  assert.equal(robotsAllows("User-agent: Googlebot\nUser-agent: *\nDisallow: /*.pdf$\n", "/jobs.pdf"), false);
  assert.equal(robotsAllows("User-agent: Googlebot\nUser-agent: *\nDisallow: /*.pdf$\n", "/jobs.pdf?x=1"), true);
});

test("a page becomes plain text, with its title, application links and structured job data", () => {
  const html = `<!doctype html><html><head><title>Careers &amp; Jobs | Harbourside Optical</title>
    <style>.x{color:red}</style><script>var tracking = "do not read";</script>
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Harbourside"},
      {"@type":"JobPosting","title":"Optician","employmentType":"FULL_TIME","baseSalary":{"@type":"MonetaryAmount","currency":"CAD","value":{"@type":"QuantitativeValue","minValue":58000,"maxValue":70000,"unitText":"YEAR"}},"description":"<p>Fit and adjust frames.</p>"}]}</script>
    </head><body><nav><a href="/">Home</a></nav>
    <h1>Join our team</h1><p>We&rsquo;re hiring an <strong>optician</strong> in Halifax&nbsp;&ndash; full time.</p>
    <ul><li>Fit frames</li><li>Dispense lenses</li></ul>
    <a href="/careers/optician/apply">Apply now</a> <a href="mailto:jobs@harbourside.ca">Email us</a> <a href="https://harbourside.ca/about">About</a>
    <!-- a comment that should vanish --></body></html>`;
  const page = readHtml(html, "https://www.harbourside.ca/careers");
  assert.equal(page.title, "Careers & Jobs | Harbourside Optical");
  assert.match(page.text, /Join our team/);
  assert.match(page.text, /We're hiring an optician in Halifax - full time\./);
  assert.match(page.text, /- Fit frames\n- Dispense lenses/);
  assert.doesNotMatch(page.text, /tracking|color:red|comment that should vanish/);
  assert.deepEqual(page.links.map((l) => l.url), ["https://www.harbourside.ca/careers/optician/apply"]);
  assert.equal(page.structured.length, 1);
  assert.match(page.structured[0], /title: Optician/);
  assert.match(page.structured[0], /minValue: 58000/);
  assert.match(page.structured[0], /description: Fit and adjust frames\./);
  assert.equal(page.truncated, false);
});

test("entities are decoded, and curly quotes and dashes become plain ones", () => {
  assert.equal(decodeEntities("Caf&eacute; &#8217;s &#x2014; &amp; &unknown;"), "Café 's - & &unknown;");
});

test("Eye Recommend is spotted however it is written", () => {
  assert.equal(mentionsEyeRecommend("Proud Eye Recommend member"), true);
  assert.equal(mentionsEyeRecommend("https://eyerecommend.ca/clinic/1"), true);
  assert.equal(mentionsEyeRecommend("Eye-Recommend"), true);
  assert.equal(mentionsEyeRecommend("We recommend an eye exam every 2 years"), false);
});

test("the copy check finds any run of 8 words taken from the page, and nothing shorter", () => {
  const page = "Our friendly team in Halifax is looking for a full time licensed optician to join us this spring.";
  const print = fingerprint(page);
  assert.equal(copiedRun("Harbourside Optical is hiring a full time optician in Halifax. The team is friendly.", print), null);
  assert.equal(copiedRun("Harbourside is looking for a full time licensed optician to join the clinic.", print), "is looking for a full time licensed optician");
  // Case, punctuation and accents do not hide a copy.
  assert.ok(copiedRun("IS LOOKING FOR A FULL-TIME, LICENSED OPTICIAN!", fingerprint("is looking for a full time licensed optician")));
});

test("the site key ignores www and subdomains, and keeps provincial addresses whole", () => {
  assert.equal(siteKey("www.harbourside.ca"), "harbourside.ca");
  assert.equal(siteKey("careers.harbourside.ca"), "harbourside.ca");
  assert.equal(siteKey("careers.clinic.on.ca"), "clinic.on.ca");
  assert.notEqual(siteKey("a.on.ca"), siteKey("b.on.ca"));
  // 2 clinics on the same website builder are 2 different clinics.
  assert.equal(siteKey("harbourside.wixsite.com"), "harbourside.wixsite.com");
  assert.notEqual(siteKey("harbourside.wixsite.com"), siteKey("maplegrove.wixsite.com"));
  // Sites told apart only by their path, and hiring systems, are never matched.
  assert.equal(siteKey("sites.google.com"), "");
  assert.equal(siteKey("harbourside.bamboohr.com"), "");
});

test("the careers page finder picks the clinic's own careers links, best first, and never a job board", async () => {
  const { careersLinks, startAddress } = await import("./page-reader.ts");
  const links = [
    { text: "Book an eye exam", url: "https://www.harbourside.ca/book" },
    { text: "Apply now", url: "https://www.harbourside.ca/careers/optician/apply" },
    { text: "Join our team", url: "https://www.harbourside.ca/careers" },
    { text: "See us on Indeed", url: "https://ca.indeed.com/cmp/harbourside/jobs" },
    { text: "Jobs", url: "https://harbourside.bamboohr.com/careers" },
    { text: "Careers", url: "https://otherclinic.ca/careers" },
  ];
  const found = careersLinks({ links }, "https://www.harbourside.ca").map((l) => l.url);
  // The clinic's hiring system page lists the jobs themselves, so it comes first, then its own careers page.
  assert.deepEqual(found.slice(0, 2), ["https://harbourside.bamboohr.com/careers", "https://www.harbourside.ca/careers"]);
  assert.ok(!found.some((u) => u.includes("indeed") || u.includes("otherclinic") || u.endsWith("/book")));
  assert.equal(startAddress("harbourside.ca"), "https://harbourside.ca");
  assert.equal(startAddress("http://harbourside.ca/"), "http://harbourside.ca/");
  assert.equal(startAddress("  "), "");
});

test("only job boards other than Indeed, LinkedIn and Jobs4ECPs are treated as leads, and the 3 are never used at all", async () => {
  const m = await import("./page-reader.ts");
  assert.match(m.refuseAddress("https://ca.indeed.com/x")!, /never reads Indeed, LinkedIn or Jobs4ECPs/);
  assert.match(m.refuseAddress("https://www.workopolis.com/search?q=optician")!, /does not copy ads/);
  assert.equal(m.isOtherJobBoard("workopolis.com"), true);
  assert.equal(m.isNeverHost("ca.indeed.com"), true);
  assert.equal(m.isNeverHost("workopolis.com"), false);
  assert.ok(m.SEARCH_BLOCKED_DOMAINS.includes("indeed.com") && m.SEARCH_BLOCKED_DOMAINS.includes("jobs4ecps.com") && m.SEARCH_BLOCKED_DOMAINS.includes("eyerecommend.ca"));
  assert.ok(!m.SEARCH_BLOCKED_DOMAINS.includes("workopolis.com"));
});

test("email addresses come only from the page, and image names, builders and no reply addresses are ignored", async () => {
  const { emailsIn, rankEmails, readHtml } = await import("./page-reader.ts");
  const html = `<p>Write to <a href="mailto:Careers@Harbourside.ca?subject=Job">us</a> or info@harbourside.ca. Logo logo@2x.png, abc123@sentry.io, noreply@harbourside.ca, jane@gmail.com.</p><script>var x="hidden@harbourside.ca"</script>`;
  assert.deepEqual(emailsIn(html).sort(), ["careers@harbourside.ca", "info@harbourside.ca", "jane@gmail.com"]);
  assert.deepEqual(rankEmails(["info@harbourside.ca", "jane@gmail.com", "careers@harbourside.ca"], "www.harbourside.ca"), ["careers@harbourside.ca", "info@harbourside.ca", "jane@gmail.com"]);
  assert.deepEqual(readHtml(html, "https://harbourside.ca/contact").emails.sort(), ["careers@harbourside.ca", "info@harbourside.ca", "jane@gmail.com"]);
});
