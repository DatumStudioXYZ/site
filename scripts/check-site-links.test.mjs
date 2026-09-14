import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { checkSiteLinks } from "./check-site-links.mjs";

const fixture = mkdtempSync(resolve(tmpdir(), "datum-link-check-"));
const write = (path, content) => {
  mkdirSync(resolve(fixture, path, ".."), { recursive: true });
  writeFileSync(resolve(fixture, path), content);
};

try {
  write("index.html", '<a href="/services/#work-better">Services</a><a href="/api/contact">Contact</a><img src="/image.png">');
  write("services/index.html", '<h1 id="work-better">Services</h1><a href="../about/">About</a>');
  write("about/index.html", "<h1>About</h1>");
  write("image.png", "fixture");
  assert.deepEqual(checkSiteLinks(fixture), []);

  write("broken/index.html", '<a href="/missing/">Missing</a><a href="/services/#missing">Fragment</a>');
  const failures = checkSiteLinks(fixture);
  assert.equal(failures.length, 2);
  assert.match(failures[0], /missing/);
  assert.match(failures[1], /#missing/);
  console.log("Link checker fixtures passed");
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
