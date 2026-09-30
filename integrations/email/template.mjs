// TurtleWorks branded email layout: forest-green header band with the logo and name,
// white body, quiet footer. Table-based with inline styles so it survives Gmail, Outlook
// and phone mail apps. Pure function, no dependencies, so the exact same source is
// embedded into the n8n Code nodes (see build-emails.mjs) and unit-tested here.
// Every string a visitor can influence is escaped; only https, mailto and tel links are emitted.

export const PALETTE = {
  forest: "#15382e",
  evergreen: "#1d5b46",
  ivory: "#f7f5ef",
  amber: "#c58a2e",
  mint: "#dcebe4",
  ink: "#17211d",
  slate: "#4a5a53",
  footer: "#f5f6f5",
  box: "#f4f7f5",
  outer: "#eef1ef",
  line: "#d5dcd8",
};

const BRAND = {
  name: "TurtleWorks",
  tagline: "Business Solutions & Technology Partner",
  site: "https://www.turtleworks.in",
  siteLabel: "turtleworks.in",
  email: "hello@turtleworks.in",
  logo: "https://www.turtleworks.in/brand/turtleworks-mark.png",
};

const FONT = "Arial,Helvetica,sans-serif";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeUrl(value) {
  const url = String(value ?? "").trim();
  if (!url || /[\s"'<>`\\]/.test(url)) return null;
  if (/^https:\/\/[^/]+/i.test(url)) {
    try {
      return new URL(url).protocol === "https:" ? url : null;
    } catch {
      return null;
    }
  }
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(url)) return url;
  if (/^tel:\+?[0-9()-]{6,20}$/i.test(url)) return url;
  return null;
}

export function paragraphsFrom(text) {
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

const text = (value) => escapeHtml(value).replace(/\n/g, "<br>");
const clip = (value, max) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export function renderEmail({ preheader = "", title = "", greeting = "", paragraphs = [], reference = null, cta = null, footerNote = "", optOut = false } = {}) {
  const P = PALETTE;
  const href = cta ? safeUrl(cta.url) : null;

  const preview = clip(preheader, 140);
  const previewBlock = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escapeHtml(preview)}${"&#847;&zwnj;&nbsp;".repeat(30)}</div>`
    : "";

  const greetingBlock = greeting
    ? `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:26px;color:${P.ink};">${text(greeting)}</p>`
    : "";

  const bodyBlocks = paragraphs
    .filter((p) => String(p ?? "").trim())
    .map((p) => `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:26px;color:${P.ink};">${text(p)}</p>`)
    .join("");

  const referenceBlock =
    reference && reference.value
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 20px;"><tr><td style="background:${P.box};border:1px solid ${P.line};border-radius:8px;padding:14px 18px;font-family:${FONT};font-size:13px;line-height:20px;color:${P.slate};">${text(reference.label || "Reference")}<br><strong style="font-size:16px;color:${P.ink};letter-spacing:0.2px;">${text(reference.value)}</strong></td></tr></table>`
      : "";

  const buttonBlock =
    cta && href
      ? `<table role="presentation" class="btn" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td style="background:${P.evergreen};border-radius:8px;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 26px;font-family:${FONT};font-size:15px;font-weight:bold;line-height:20px;color:${P.ivory};text-decoration:none;border-radius:8px;">${text(cta.label)}</a></td></tr></table>`
      : "";

  const why = footerNote ? clip(footerNote, 240) : "You are receiving this email because you contacted TurtleWorks.";
  const stop = optOut ? `<br>Prefer not to hear from us? Reply STOP and we won't email you again.` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(clip(title, 120) || BRAND.name)}</title>
<style>@media only screen and (max-width:620px){.container{width:100%!important}.px{padding-left:20px!important;padding-right:20px!important}.btn,.btn td,.btn a{display:block!important;text-align:center!important}}</style>
</head>
<body style="margin:0;padding:0;background:${P.outer};">
${previewBlock}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${P.outer};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid ${P.line};border-radius:10px;overflow:hidden;">
<tr><td class="px" style="background:${P.forest};padding:26px 32px;border-bottom:3px solid ${P.amber};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:14px;vertical-align:middle;"><img src="${BRAND.logo}" width="44" height="44" alt="${BRAND.name} logo" style="display:block;width:44px;height:44px;border:0;border-radius:9px;background:${P.ivory};"></td>
<td style="vertical-align:middle;font-family:${FONT};font-size:22px;line-height:26px;font-weight:bold;letter-spacing:-0.3px;color:${P.ivory};">${BRAND.name}<br><span style="font-size:12px;line-height:18px;font-weight:normal;letter-spacing:0;color:${P.mint};">${escapeHtml(BRAND.tagline)}</span></td>
</tr></table>
</td></tr>
<tr><td class="px" style="padding:36px 32px 12px;">
${greetingBlock}${bodyBlocks}${referenceBlock}${buttonBlock}
</td></tr>
<tr><td class="px" style="background:${P.footer};border-top:1px solid ${P.line};padding:24px 32px;font-family:${FONT};font-size:12px;line-height:19px;color:${P.slate};">
<strong style="color:${P.ink};">${BRAND.name}</strong> &middot; ${escapeHtml(BRAND.tagline)}<br>
<a href="${BRAND.site}" style="color:${P.evergreen};text-decoration:underline;">${BRAND.siteLabel}</a> &middot; <a href="mailto:${BRAND.email}" style="color:${P.evergreen};text-decoration:underline;">${BRAND.email}</a><br>
<span style="display:block;padding-top:10px;">${escapeHtml(why)}${stop}</span>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}
