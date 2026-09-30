import test from "node:test";
import assert from "node:assert/strict";
import { PALETTE, escapeHtml, paragraphsFrom, renderEmail, safeUrl } from "./template.mjs";

const sample = () =>
  renderEmail({
    preheader: "We have your enquiry",
    title: "We've received your enquiry",
    greeting: "Hi Asha,",
    paragraphs: ["Thank you for getting in touch. Your message has reached us.", "If anything is time-sensitive,\nsimply reply to this email."],
    reference: { label: "Your reference", value: "TW-20260930-AB12" },
    cta: { label: "Visit TurtleWorks", url: "https://www.turtleworks.in" },
  });

test("shows the company name, tagline and logo in the header", () => {
  const html = sample();
  assert.match(html, />\s*TurtleWorks\s*<br>/);
  assert.match(html, /Business Solutions &amp; Technology Partner/);
  assert.match(html, /<img[^>]+src="https:\/\/www\.turtleworks\.in\/brand\/turtleworks-mark\.png"/);
  assert.match(html, /<img[^>]+alt="TurtleWorks logo"/);
  assert.match(html, /<img[^>]+width="44"[^>]+height="44"/);
});

test("the company name is live text, so the header still reads with images blocked", () => {
  const withoutImages = sample().replace(/<img[^>]*>/g, "");
  assert.match(withoutImages, /TurtleWorks/);
});

test("has a header band, a white body and a footer, in that order", () => {
  const html = sample();
  const header = html.indexOf(PALETTE.forest);
  const body = html.indexOf("Hi Asha,");
  const footer = html.indexOf("You are receiving this");
  assert.ok(header > -1 && header < body, "header band comes first");
  assert.ok(body < footer, "footer comes last");
  assert.match(html, /border-bottom:3px solid #c58a2e/i);
});

test("the greeting, paragraphs, reference and button all render", () => {
  const html = sample();
  assert.match(html, /Hi Asha,/);
  assert.match(html, /Thank you for getting in touch\./);
  assert.match(html, /If anything is time-sensitive,<br>simply reply to this email\./);
  assert.match(html, /Your reference/);
  assert.match(html, /TW-20260930-AB12/);
  assert.match(html, /<a href="https:\/\/www\.turtleworks\.in"[^>]*>Visit TurtleWorks<\/a>/);
});

test("is built for email clients: tables, inline styles, 600px, no scripts or external CSS", () => {
  const html = sample();
  assert.match(html, /<html lang="en"/);
  assert.match(html, /width="600"/);
  assert.match(html, /max-width:600px/);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<link\b/i);
  assert.doesNotMatch(html, /@import/i);
  assert.doesNotMatch(html, /url\(/i);
  assert.doesNotMatch(html, /javascript:/i);
  const tables = html.match(/<table\b[^>]*>/g) ?? [];
  assert.ok(tables.length >= 4);
  assert.ok(tables.every((t) => /role="presentation"/.test(t)), "every layout table is marked presentational");
  assert.match(html, /name="color-scheme" content="light"/);
  assert.match(html, /name="viewport"/);
});

test("a hidden preview line comes first in the body and is capped", () => {
  const html = renderEmail({ preheader: "x".repeat(400), greeting: "Hi", paragraphs: ["Body"] });
  const pre = /<div style="display:none[^"]*">([^<]*)<\/div>/.exec(html);
  assert.ok(pre, "preheader div exists");
  assert.ok(html.indexOf(pre[0]) < html.indexOf("Body"));
  assert.ok(pre[1].replace(/&[a-z0-9#]+;/g, "").length <= 200);
});

test("everything supplied by a visitor is escaped", () => {
  const evil = `"><img src=x onerror=alert(1)><script>alert(2)</script>`;
  const html = renderEmail({
    preheader: evil,
    title: evil,
    greeting: `Hi ${evil},`,
    paragraphs: [evil, `line\n${evil}`],
    reference: { label: evil, value: evil },
    cta: { label: evil, url: "https://www.turtleworks.in/?a=1&b=2" },
    footerNote: evil,
  });
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /onerror=alert\(1\)>/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /href="https:\/\/www\.turtleworks\.in\/\?a=1&amp;b=2"/);
});

test("only https, mailto and tel links are ever emitted", () => {
  assert.equal(safeUrl("https://www.turtleworks.in/x"), "https://www.turtleworks.in/x");
  assert.equal(safeUrl("mailto:hello@turtleworks.in"), "mailto:hello@turtleworks.in");
  assert.equal(safeUrl("tel:+918499989116"), "tel:+918499989116");
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "http://insecure.example.com", "//evil.example.com", "vbscript:x", "  JaVaScRiPt:alert(1)", "", "https://exa mple.com", 'https://x.com/"onmouseover="alert(1)']) {
    assert.equal(safeUrl(bad), null, bad);
  }
});

test("a button with an unsafe address is dropped rather than sent", () => {
  const html = renderEmail({ greeting: "Hi", paragraphs: ["Body"], cta: { label: "Click", url: "javascript:alert(1)" } });
  assert.doesNotMatch(html, /Click/);
  assert.doesNotMatch(html, /javascript:/);
});

test("the footer says why the email arrived and how to reach the team", () => {
  const html = sample();
  assert.match(html, /You are receiving this/);
  assert.match(html, /href="https:\/\/www\.turtleworks\.in"[^>]*>turtleworks\.in<\/a>/);
  assert.match(html, /href="mailto:hello@turtleworks\.in"[^>]*>hello@turtleworks\.in<\/a>/);
  assert.doesNotMatch(html, /Reply STOP/);
});

test("follow-up emails carry a clear way to stop them", () => {
  const html = renderEmail({ greeting: "Hi", paragraphs: ["Body"], optOut: true });
  assert.match(html, /Reply STOP/);
});

test("the reason for receiving the email can be customised, and no address is invented", () => {
  const html = renderEmail({ greeting: "Hi", paragraphs: ["Body"], footerNote: "You are receiving this because you emailed hello@turtleworks.in." });
  assert.match(html, /because you emailed hello@turtleworks\.in/);
  assert.doesNotMatch(html, /undefined|null|NaN/);
  assert.doesNotMatch(html, /Road|Street|Pin ?code/i);
});

test("optional parts can be left out without leaving holes", () => {
  const html = renderEmail({ paragraphs: ["Just this."] });
  assert.match(html, /Just this\./);
  assert.doesNotMatch(html, /undefined|null|NaN/);
  assert.doesNotMatch(html, /Your reference/);
});

test("paragraphsFrom splits plain text on blank lines and keeps single line breaks", () => {
  assert.deepEqual(paragraphsFrom("A\n\nB line 1\nB line 2\r\n\r\n\r\nC"), ["A", "B line 1\nB line 2", "C"]);
  assert.deepEqual(paragraphsFrom(""), []);
  assert.deepEqual(paragraphsFrom(undefined), []);
});

test("escapeHtml covers the five dangerous characters", () => {
  assert.equal(escapeHtml(`<>&"'`), "&lt;&gt;&amp;&quot;&#39;");
  assert.equal(escapeHtml(undefined), "");
});

test("every text and background pairing meets WCAG AA contrast (4.5:1)", () => {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const pairs = [
    ["ink on white", PALETTE.ink, "#ffffff"],
    ["ivory on forest (header name)", PALETTE.ivory, PALETTE.forest],
    ["mint on forest (tagline)", PALETTE.mint, PALETTE.forest],
    ["ivory on evergreen (button)", PALETTE.ivory, PALETTE.evergreen],
    ["slate on footer", PALETTE.slate, PALETTE.footer],
    ["slate on reference box", PALETTE.slate, PALETTE.box],
    ["ink on reference box", PALETTE.ink, PALETTE.box],
    ["evergreen links on white", PALETTE.evergreen, "#ffffff"],
  ];
  for (const [name, fg, bg] of pairs) assert.ok(ratio(fg, bg) >= 4.5, `${name} is only ${ratio(fg, bg).toFixed(2)}:1`);
});

test("stays far below the size where Gmail clips messages", () => {
  const long = renderEmail({ greeting: "Hi", paragraphs: Array.from({ length: 30 }, (_, i) => `Paragraph ${i} ${"word ".repeat(60)}`) });
  assert.ok(sample().length < 12_000, `sample is ${sample().length} bytes`);
  assert.ok(long.length < 60_000);
});

test("output is stable for the same input", () => {
  assert.equal(sample(), sample());
});
