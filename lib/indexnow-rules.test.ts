// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { indexNowPayload, indexNowUrls, validKey } from "./indexnow-rules.ts";

const SITE = "https://eyecarejobs.ca";

test("only our own https pages are sent, once each", () => {
  const urls = indexNowUrls(SITE, ["https://eyecarejobs.ca/", "https://eyecarejobs.ca/", "https://example.com/x", "http://eyecarejobs.ca/insecure", "not a url", "https://eyecarejobs.ca/blog/a"]);
  assert.deepEqual(urls, ["https://eyecarejobs.ca/", "https://eyecarejobs.ca/blog/a"]);
});

test("the request names the host, the key and where the key file is", () => {
  const p = indexNowPayload(SITE, "abc12345abc12345", ["https://eyecarejobs.ca/jobs"]);
  assert.equal(p.host, "eyecarejobs.ca");
  assert.equal(p.keyLocation, "https://eyecarejobs.ca/indexnow-key.txt");
  assert.deepEqual(p.urlList, ["https://eyecarejobs.ca/jobs"]);
});

test("a key is 8 to 128 letters, numbers or hyphens", () => {
  assert.equal(validKey("a1b2c3d4e5f60718"), true);
  assert.equal(validKey("short"), false);
  assert.equal(validKey("has spaces in it 123"), false);
  assert.equal(validKey(""), false);
});
