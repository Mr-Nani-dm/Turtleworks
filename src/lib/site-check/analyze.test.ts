import test from "node:test";
import assert from "node:assert/strict";
import { analyzePage, summarize } from "./analyze";
import type { Category, PageData } from "./types";

const NOW = new Date("2026-09-30T06:30:00Z");

const GOOD = `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<title>Sharma Interiors — Interior designers in Hyderabad</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Sharma Interiors designs homes and offices in Hyderabad. See our projects, prices and how a project works, then message us on WhatsApp.">
<link rel="canonical" href="https://sharma.example.com/">
<meta property="og:title" content="Sharma Interiors"><meta property="og:image" content="https://sharma.example.com/og.jpg">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"Sharma Interiors","telephone":"+919876543210","address":{"@type":"PostalAddress","addressLocality":"Hyderabad"}}</script>
<script src="/app.js" defer></script>
</head><body>
<a href="#main" class="sr-only">Skip to content</a>
<nav aria-label="Main"><a href="/">Home</a> <a href="/about">About</a></nav>
<main id="main">
<h1>Interior design for Hyderabad homes</h1>
<h2>Our work</h2>
<img src="/a.jpg" alt="Living room" width="800" height="600"><img src="/b.jpg" alt="Kitchen" width="800" height="600">
<h2>Get in touch</h2>
<a href="https://wa.me/919876543210">WhatsApp us</a> <a href="tel:+919876543210">Call</a>
<form action="/enquire"><label for="email">Email</label><input id="email" type="email" name="email"><label for="m">Message</label><textarea id="m" name="m"></textarea></form>
</main>
<a href="/privacy">Privacy policy</a>
<footer>© 2026 Sharma Interiors</footer>
</body></html>`;

const page = (html: string, extra: Partial<PageData> = {}): PageData => ({
  finalUrl: "https://sharma.example.com/",
  status: 200,
  headers: { "strict-transport-security": "max-age=31536000", "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "no-referrer" },
  html,
  htmlTruncated: false,
  robotsTxt: "User-agent: *\nAllow: /\nSitemap: https://sharma.example.com/sitemap.xml",
  sitemapFound: true,
  llmsTxtFound: true,
  ...extra,
});

const all = (cats: Category[]) => cats.flatMap((c) => c.checks);
const get = (cats: Category[], id: string) => {
  const check = all(cats).find((c) => c.id === id);
  assert.ok(check, `check "${id}" missing; have ${all(cats).map((c) => c.id).join(", ")}`);
  return check;
};
const status = (html: string, id: string, extra: Partial<PageData> = {}) => get(analyzePage(page(html, extra), NOW), id).status;

// ── structure ──

test("a well-built page passes every check", () => {
  const cats = analyzePage(page(GOOD), NOW);
  const notPassing = all(cats).filter((c) => c.status !== "pass");
  assert.deepEqual(notPassing.map((c) => `${c.id}:${c.status}`), []);
});

test("every check explains itself in plain words and cites a standard", () => {
  for (const check of all(analyzePage(page("<html><body>hi</body></html>"), NOW))) {
    assert.ok(check.label.length > 3, check.id);
    assert.ok(check.detail.length > 3, `${check.id} detail`);
    assert.ok(check.why.length > 10, `${check.id} why`);
    assert.ok(check.fix.length > 10, `${check.id} fix`);
    assert.ok([1, 2, 3].includes(check.impact), `${check.id} impact`);
    assert.ok(check.standard.length > 3, `${check.id} standard must cite its source`);
  }
});

test("check ids are unique and grouped into the six categories", () => {
  const cats = analyzePage(page(GOOD), NOW);
  assert.deepEqual(cats.map((c) => c.id), ["search", "ai", "enquiries", "trust", "performance", "accessibility"]);
  const ids = all(cats).map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

// ── search ──

test("title: missing fails, too short or too long warns", () => {
  assert.equal(status(GOOD.replace(/<title>.*<\/title>/, ""), "title"), "fail");
  assert.equal(status(GOOD.replace(/<title>.*<\/title>/, "<title>Home</title>"), "title"), "warn");
  assert.equal(status(GOOD.replace(/<title>.*<\/title>/, `<title>${"Long ".repeat(20)}</title>`), "title"), "warn");
  assert.equal(status(GOOD.replace(/<title>.*<\/title>/, "<title>   </title>"), "title"), "fail");
});

test("title text is decoded and truncated for display", () => {
  const cats = analyzePage(page(GOOD.replace(/<title>.*<\/title>/, `<title>Tom &amp; Jerry ${"x".repeat(400)}</title>`)), NOW);
  const detail = get(cats, "title").detail;
  assert.match(detail, /Tom & Jerry/);
  assert.ok(detail.length <= 220, `detail was ${detail.length} chars`);
});

test("meta description: attribute order does not matter; missing fails; wrong length warns", () => {
  const reversed = GOOD.replace(/<meta name="description" content="([^"]*)">/, '<meta content="$1" name="description">');
  assert.equal(status(reversed, "description"), "pass");
  assert.equal(status(GOOD.replace(/<meta name="description"[^>]*>/, ""), "description"), "fail");
  assert.equal(status(GOOD.replace(/<meta name="description"[^>]*>/, '<meta name="description" content="Short one">'), "description"), "warn");
  assert.equal(status(GOOD.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${"word ".repeat(60)}">`), "description"), "warn");
});

test("h1: none fails, exactly one passes, several warns; markup inside scripts is not counted", () => {
  assert.equal(status(GOOD.replace(/<h1>.*<\/h1>/, ""), "h1"), "fail");
  assert.equal(status(GOOD, "h1"), "pass");
  assert.equal(status(GOOD.replace("<h1>", "<h1>A</h1><h1>"), "h1"), "warn");
  assert.equal(status(GOOD.replace("</body>", '<script>document.write("<h1>x</h1><h1>y</h1>")</script></body>'), "h1"), "pass");
  assert.equal(status(GOOD.replace("</body>", "<!-- <h1>old</h1> --></body>"), "h1"), "pass");
});

test("noindex, in the page or in a header, fails; a robots.txt that blocks everything fails", () => {
  assert.equal(status(GOOD.replace("<head>", '<head><meta name="robots" content="noindex, nofollow">'), "indexable"), "fail");
  assert.equal(status(GOOD.replace("<head>", '<head><meta name="googlebot" content="NOINDEX">'), "indexable"), "fail");
  assert.equal(status(GOOD, "indexable", { headers: { "x-robots-tag": "noindex" } }), "fail");
  assert.equal(status(GOOD, "indexable", { robotsTxt: "User-agent: *\nDisallow: /" }), "fail");
  assert.equal(status(GOOD, "indexable", { robotsTxt: "User-agent: *\nDisallow: /admin" }), "pass");
  assert.equal(status(GOOD, "indexable", { robotsTxt: "User-agent: *\nDisallow: /\n\nUser-agent: Googlebot\nAllow: /" }), "pass");
  assert.equal(status(GOOD.replace("<head>", '<head><meta name="robots" content="index, follow">'), "indexable"), "pass");
});

test("robots.txt, sitemap, canonical, language and social preview are each checked", () => {
  assert.equal(status(GOOD, "robots-txt", { robotsTxt: null }), "warn");
  assert.equal(status(GOOD, "sitemap", { sitemapFound: false }), "warn");
  assert.equal(status(GOOD.replace(/<link rel="canonical"[^>]*>/, ""), "canonical"), "warn");
  assert.equal(status(GOOD.replace('<html lang="en">', "<html>"), "language"), "warn");
  assert.equal(status(GOOD.replace(/<meta property="og:image"[^>]*>/, ""), "open-graph"), "warn");
  assert.equal(status(GOOD.replace(/<meta property="og:title"[^>]*>/, ""), "open-graph"), "warn");
});

test("image alt text: all present passes, missing warns, decorative empty alt is fine, no images is not a failure", () => {
  assert.equal(status(GOOD, "image-alt"), "pass");
  assert.equal(status(GOOD.replace(' alt="Living room"', "").replace(' alt="Kitchen"', ""), "image-alt"), "warn");
  assert.equal(status(GOOD.replace('alt="Living room"', 'alt=""'), "image-alt"), "pass");
  assert.notEqual(status(GOOD.replace(/<img[^>]*>/g, ""), "image-alt"), "fail");
});

test("structured data: recognised business types pass, none warns, broken JSON is ignored", () => {
  assert.equal(status(GOOD, "structured-data"), "pass");
  assert.equal(status(GOOD.replace(/<script type="application\/ld\+json">.*<\/script>/, ""), "structured-data"), "warn");
  assert.equal(status(GOOD.replace('"@type":"LocalBusiness"', '"@type":"Dentist"'), "structured-data"), "pass");
  assert.equal(status(GOOD.replace('"@type":"LocalBusiness","name":"Sharma Interiors","telephone":"+919876543210","address":{"@type":"PostalAddress","addressLocality":"Hyderabad"}', '"@type":"LocalBusiness",'), "structured-data"), "warn");
  assert.equal(status(GOOD.replace(/"@type":"LocalBusiness"/, '"@graph":[{"@type":"Organization"},{"@type":"FAQPage"}]'), "structured-data"), "pass");
});

test("schema completeness: name alone warns, name+phone or name+address passes", () => {
  const ldFull = '{"@context":"https://schema.org","@type":"LocalBusiness","name":"Test","telephone":"+91123","address":{"@type":"PostalAddress","addressLocality":"City"}}';
  const ldNameOnly = '{"@context":"https://schema.org","@type":"LocalBusiness","name":"Test"}';
  const ldNoName = '{"@context":"https://schema.org","@type":"LocalBusiness","telephone":"+91123"}';
  const wrap = (ld: string) => GOOD.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${ld}</script>`);
  assert.equal(status(wrap(ldFull), "schema-complete"), "pass");
  assert.equal(status(wrap(ldNameOnly), "schema-complete"), "warn");
  assert.equal(status(wrap(ldNoName), "schema-complete"), "warn");
  assert.equal(status(GOOD.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ""), "schema-complete"), "info");
});

test("link health: empty hrefs and javascript: hrefs warn, normal links pass", () => {
  assert.equal(status(GOOD, "link-health"), "pass");
  assert.equal(status(GOOD.replace("</main>", '<a href="">empty</a></main>'), "link-health"), "warn");
  assert.equal(status(GOOD.replace("</main>", '<a href="javascript:void(0)">bad</a></main>'), "link-health"), "warn");
  assert.equal(status(GOOD.replace("</main>", '<a href="#">anchor</a></main>'), "link-health"), "pass");
});

// ── ai ──

test("llms.txt is an opportunity, never a failure", () => {
  assert.equal(status(GOOD, "llms-txt", { llmsTxtFound: true }), "pass");
  assert.equal(status(GOOD, "llms-txt", { llmsTxtFound: false }), "info");
});

test("blocking AI crawlers is reported as information, with the names", () => {
  const blocked = "User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: *\nAllow: /";
  const cats = analyzePage(page(GOOD, { robotsTxt: blocked }), NOW);
  const check = get(cats, "ai-crawlers");
  assert.equal(check.status, "info");
  assert.match(check.detail, /GPTBot/);
  assert.match(check.detail, /ClaudeBot/);
  assert.equal(status(GOOD, "ai-crawlers"), "pass");
  assert.equal(status(GOOD, "ai-crawlers", { robotsTxt: null }), "pass");
});

// ── enquiries ──

test("contact routes: whatsapp and phone links are looked for separately", () => {
  assert.equal(status(GOOD, "whatsapp"), "pass");
  assert.equal(status(GOOD.replace("https://wa.me/919876543210", "https://api.whatsapp.com/send?phone=91987"), "whatsapp"), "pass");
  assert.equal(status(GOOD.replace("https://wa.me/919876543210", "whatsapp://send?phone=91987"), "whatsapp"), "pass");
  assert.equal(status(GOOD.replace(/<a href="https:\/\/wa.me[^>]*>[^<]*<\/a>/, ""), "whatsapp"), "warn");
  assert.equal(status(GOOD, "tap-to-call"), "pass");
  assert.equal(status(GOOD.replace(/<a href="tel:[^>]*>[^<]*<\/a>/, ""), "tap-to-call"), "warn");
});

test("a page with no way to contact the business fails the main contact check", () => {
  const bare = GOOD.replace(/<a href="https:\/\/wa.me[^>]*>[^<]*<\/a>/, "").replace(/<a href="tel:[^>]*>[^<]*<\/a>/, "").replace(/<form[\s\S]*<\/form>/, "");
  assert.equal(status(bare, "contact-route"), "fail");
  assert.equal(status(bare.replace("</main>", '<a href="mailto:hi@x.in">Email</a></main>'), "contact-route"), "pass");
  assert.equal(status(GOOD, "contact-route"), "pass");
});

// ── trust ──

test("https is required; http pages fail", () => {
  assert.equal(status(GOOD, "https"), "pass");
  assert.equal(status(GOOD, "https", { finalUrl: "http://sharma.example.com/" }), "fail");
});

test("mixed content on an https page is flagged, https and relative links are not", () => {
  assert.equal(status(GOOD, "mixed-content"), "pass");
  assert.equal(status(GOOD.replace("</main>", '<img src="http://cdn.example.com/x.jpg"></main>'), "mixed-content"), "warn");
  assert.equal(status(GOOD.replace("</main>", '<script src="http://cdn.example.com/x.js"></script></main>'), "mixed-content"), "warn");
  assert.equal(status(GOOD.replace("</main>", '<a href="http://other.example.com/">plain link</a></main>'), "mixed-content"), "pass");
});

test("a privacy policy link is looked for by text or address", () => {
  assert.equal(status(GOOD, "privacy-policy"), "pass");
  assert.equal(status(GOOD.replace(/<a href="\/privacy">[^<]*<\/a>/, '<a href="/legal/privacy-policy.html">Legal</a>'), "privacy-policy"), "pass");
  assert.equal(status(GOOD.replace(/<a href="\/privacy">[^<]*<\/a>/, '<a href="/legal">Privacy notice</a>'), "privacy-policy"), "pass");
  assert.equal(status(GOOD.replace(/<a href="\/privacy">[^<]*<\/a>/, ""), "privacy-policy"), "warn");
});

test("an old copyright year warns; a missing one is simply not reported", () => {
  assert.equal(status(GOOD, "copyright-year"), "pass");
  assert.equal(status(GOOD.replace("© 2026", "© 2025"), "copyright-year"), "pass");
  assert.equal(status(GOOD.replace("© 2026", "© 2019"), "copyright-year"), "warn");
  assert.equal(status(GOOD.replace("© 2026", "&copy; 2018 - 2020"), "copyright-year"), "warn");
  assert.equal(status(GOOD.replace("© 2026", "Copyright 2016-2026"), "copyright-year"), "pass");
  assert.equal(all(analyzePage(page(GOOD.replace("© 2026 Sharma Interiors", "")), NOW)).some((c) => c.id === "copyright-year"), false);
});

test("security headers: three or more pass, fewer warn", () => {
  assert.equal(status(GOOD, "security-headers"), "pass");
  assert.equal(status(GOOD, "security-headers", { headers: { "strict-transport-security": "max-age=1" } }), "warn");
  assert.equal(status(GOOD, "security-headers", { headers: {} }), "warn");
  assert.equal(status(GOOD, "security-headers", { headers: { "strict-transport-security": "x", "x-content-type-options": "nosniff", "content-security-policy": "frame-ancestors 'none'" } }), "pass");
});

// ── performance ──

test("a homepage that returns an error status fails", () => {
  assert.equal(status(GOOD, "homepage-loads"), "pass");
  assert.equal(status(GOOD, "homepage-loads", { status: 500 }), "fail");
  assert.equal(status(GOOD, "homepage-loads", { status: 404 }), "fail");
});

test("mobile viewport is required", () => {
  assert.equal(status(GOOD, "viewport"), "pass");
  assert.equal(status(GOOD.replace(/<meta name="viewport"[^>]*>/, ""), "viewport"), "fail");
  assert.equal(status(GOOD.replace("width=device-width, initial-scale=1", "width=1024"), "viewport"), "fail");
});

test("render-blocking scripts in <head> without defer or async warn", () => {
  assert.equal(status(GOOD, "render-blocking"), "pass");
  const blocking = GOOD.replace('<script src="/app.js" defer></script>', '<script src="/app.js"></script>');
  assert.equal(status(blocking, "render-blocking"), "warn");
  const inlineOk = GOOD.replace('<script src="/app.js" defer></script>', '<script>var x=1;</script>');
  assert.equal(status(inlineOk, "render-blocking"), "pass");
  const asyncOk = GOOD.replace('defer', 'async');
  assert.equal(status(asyncOk, "render-blocking"), "pass");
  const jsonLdOk = GOOD.replace('<script src="/app.js" defer></script>', '');
  assert.equal(status(jsonLdOk, "render-blocking"), "pass");
  const noModuleOk = GOOD.replace('<script src="/app.js" defer></script>', '<script src="/legacy.js" nomodule></script>');
  assert.equal(status(noModuleOk, "render-blocking"), "pass");
});

test("images without width and height warn about layout shift", () => {
  assert.equal(status(GOOD, "image-dimensions"), "pass");
  const noDims = GOOD.replace(/ width="800" height="600"/g, "");
  assert.equal(status(noDims, "image-dimensions"), "warn");
  const partial = GOOD.replace(' width="800" height="600"><img src="/b.jpg"', '><img src="/b.jpg"');
  assert.equal(status(partial, "image-dimensions"), "warn");
});

// ── accessibility ──

test("heading hierarchy: skipping levels warns, sequential is fine", () => {
  assert.equal(status(GOOD, "heading-order"), "pass");
  const skip = GOOD.replace("<h2>Our work</h2>", "<h3>Our work</h3>");
  assert.equal(status(skip, "heading-order"), "warn");
  const h1ToH3 = `<html><body><h1>Main</h1><h3>Skipped</h3></body></html>`;
  assert.equal(status(h1ToH3, "heading-order"), "warn");
});

test("form inputs should have associated labels", () => {
  assert.equal(status(GOOD, "form-labels"), "pass");
  const noLabels = GOOD.replace(/<label[^>]*>[^<]*<\/label>/g, "");
  assert.equal(status(noLabels, "form-labels"), "warn");
  const ariaLabel = GOOD.replace(/<label for="email">Email<\/label><input id="email"/, '<input aria-label="Email"');
  assert.equal(status(ariaLabel, "form-labels"), "pass");
});

// ── cross-cutting ──

test("hostile page content is returned as plain text, capped, never as markup we generate", () => {
  const evil = `<title>&lt;img src=x onerror=alert(1)&gt;${"A".repeat(1000)}</title>`;
  const cats = analyzePage(page(GOOD.replace(/<title>.*<\/title>/, evil)), NOW);
  for (const c of all(cats)) assert.ok(c.detail.length <= 220 && c.why.length <= 300 && c.fix.length <= 300, c.id);
});

test("a huge page is handled without blowing up", () => {
  const big = GOOD.replace("</main>", `${"<p>filler</p>".repeat(200_000)}</main>`);
  const started = Date.now();
  analyzePage(page(big), NOW);
  assert.ok(Date.now() - started < 1500, "analysis took too long");
});

test("empty or non-HTML pages produce findings instead of errors", () => {
  assert.doesNotThrow(() => analyzePage(page(""), NOW));
  assert.doesNotThrow(() => analyzePage(page("%PDF-1.4 \u0000\u0001 binary"), NOW));
  assert.equal(status("", "title"), "fail");
});

test("summary counts checks that can pass or fail, ignores info, and lists the biggest gaps first", () => {
  const html = GOOD.replace(/<title>.*<\/title>/, "").replace(/<a href="tel:[^>]*>[^<]*<\/a>/, "").replace(/<link rel="canonical"[^>]*>/, "");
  const cats = analyzePage(page(html, { llmsTxtFound: false }), NOW);
  const s = summarize(cats);
  const countable = all(cats).filter((c) => c.status !== "info");
  assert.equal(s.total, countable.length);
  assert.equal(s.passed, countable.filter((c) => c.status === "pass").length);
  assert.ok(s.gaps.length <= 3);
  assert.equal(s.gaps[0].id, "title", "the missing title (high impact, fail) should lead");
  assert.ok(s.gaps.every((g) => g.status === "fail" || g.status === "warn"));
  const impacts = s.gaps.map((g) => g.impact);
  assert.deepEqual(impacts, [...impacts].sort((a, b) => b - a));
});

test("a clean page has no gaps", () => {
  const s = summarize(analyzePage(page(GOOD), NOW));
  assert.equal(s.gaps.length, 0);
  assert.equal(s.passed, s.total);
});
