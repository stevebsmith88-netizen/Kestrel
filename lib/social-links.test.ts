// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { clinicJsonLd } from "./clinic-pages.ts";
import { cleanClinicSocials, cleanSocialUrl, socialLinksFrom, socialRow } from "./social-links.ts";

test("a blank answer is fine and clears the link", () => {
  assert.deepEqual(cleanSocialUrl("instagram", ""), { url: "" });
  assert.deepEqual(cleanSocialUrl("facebook", "   "), { url: "" });
  assert.deepEqual(cleanSocialUrl("linkedin", undefined), { url: "" });
});

test("a good address is kept, with www and tracking tidied", () => {
  assert.equal(cleanSocialUrl("instagram", "https://www.instagram.com/northgateeyecare/?igsh=abc123").url, "https://www.instagram.com/northgateeyecare");
  assert.equal(cleanSocialUrl("instagram", "instagram.com/northgateeyecare").url, "https://instagram.com/northgateeyecare");
  assert.equal(cleanSocialUrl("facebook", "https://m.facebook.com/northgate#about").url, "https://m.facebook.com/northgate");
  assert.equal(cleanSocialUrl("linkedin", "https://ca.linkedin.com/company/northgate-eye-care/").url, "https://ca.linkedin.com/company/northgate-eye-care");
});

test("only the platform's own website is accepted, and only over https", () => {
  for (const bad of ["https://evil.example.com/instagram.com/x", "https://instagram.com.evil.com/x", "http://www.instagram.com/x", "javascript:alert(1)", "https://user:pw@instagram.com/x", "https://instagram.com:8080/x", "ftp://instagram.com/x", "https://notinstagram.com/x"]) {
    assert.ok(cleanSocialUrl("instagram", bad).error, `${bad} should be refused`);
  }
  assert.ok(cleanSocialUrl("facebook", "https://instagram.com/x").error, "an Instagram address is not a Facebook page");
  assert.ok(cleanSocialUrl("instagram", "https://www.instagram.com/").error, "the home page alone is not a page");
  assert.ok(cleanSocialUrl("facebook", `https://facebook.com/${"a".repeat(300)}`).error, "too long");
});

test("a clinic gives a LinkedIn company page and a candidate gives their own profile", () => {
  assert.ok(cleanSocialUrl("linkedin", "https://www.linkedin.com/in/sam-lee", "clinic").error);
  assert.equal(cleanSocialUrl("linkedin", "https://www.linkedin.com/company/acme", "clinic").url, "https://www.linkedin.com/company/acme");
  assert.ok(cleanSocialUrl("linkedin", "https://www.linkedin.com/company/acme", "candidate").error);
  assert.equal(cleanSocialUrl("linkedin", "https://www.linkedin.com/in/sam-lee/", "candidate").url, "https://www.linkedin.com/in/sam-lee");
});

test("a clinic form reports each bad link by name and keeps the good ones", () => {
  const out = cleanClinicSocials({ instagram: "https://www.instagram.com/a", facebook: "https://example.com/a", linkedin: "" });
  assert.deepEqual(out.links, { instagram: "https://www.instagram.com/a" });
  assert.deepEqual(Object.keys(out.errors), ["social_facebook"]);
  assert.deepEqual(socialRow(out.links), { social_instagram: "https://www.instagram.com/a", social_facebook: null, social_linkedin: null });
});

test("a bad value stored in the database never becomes a link on the page", () => {
  const shown = socialLinksFrom({ social_instagram: "javascript:alert(1)", social_facebook: "https://www.facebook.com/ok", social_linkedin: null });
  assert.deepEqual(shown.map((s) => s.key), ["facebook"]);
  assert.deepEqual(socialLinksFrom(null), []);
});

test("search engines are told about the social pages beside the website", () => {
  const clinic = { id: "1", clinic_name: "Northgate", practice_type: "independent", website: "https://northgate.ca", province: "Ontario", city: "Guelph", about: null, social_instagram: "https://www.instagram.com/northgate" };
  assert.deepEqual(clinicJsonLd(clinic, "northgate", "https://eyecarejobs.ca").sameAs, ["https://northgate.ca", "https://www.instagram.com/northgate"]);
});

test("the pages that show or save the links use these checks", () => {
  assert.match(readFileSync("lib/clinic-actions.ts", "utf8"), /cleanClinicSocials\(/);
  assert.match(readFileSync("lib/candidate-actions.ts", "utf8"), /cleanSocialUrl\("linkedin"/);
  assert.match(readFileSync("components/EmployerPage.tsx", "utf8"), /socialLinksFrom\(/);
});
