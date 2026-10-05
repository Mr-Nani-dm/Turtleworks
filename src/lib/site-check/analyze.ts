import type { Category, Check, PageData, Summary, Status } from "./types";

const cap = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&copy;/g, "©")
    .replace(/&middot;/g, "·");
}

function stripScriptsAndComments(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
}

function metaContent(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]*(?:name=["']${name}["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*name=["']${name}["'])[^>]*>`,
    "i",
  );
  const m = html.match(re);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

function metaPropContent(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]*(?:property=["']${prop}["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*property=["']${prop}["'])[^>]*>`,
    "i",
  );
  const m = html.match(re);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

function countH1(html: string): number {
  const clean = stripScriptsAndComments(html);
  const matches = clean.match(/<h1[\s>]/gi);
  return matches ? matches.length : 0;
}

const AI_CRAWLERS = [
  "GPTBot", "ChatGPT-User", "Google-Extended", "ClaudeBot", "anthropic-ai",
  "CCBot", "PerplexityBot", "Bytespider", "Amazonbot", "FacebookBot", "Cohere-ai",
];

function parseRobotsTxt(txt: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  let currentAgents: string[] = [];
  for (const raw of txt.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [key, ...rest] = line.split(":");
    const val = rest.join(":").trim();
    if (key.toLowerCase() === "user-agent") {
      currentAgents.push(val);
    } else {
      if (currentAgents.length) {
        for (const a of currentAgents) {
          if (!blocks.has(a)) blocks.set(a, []);
          blocks.get(a)!.push(`${key.toLowerCase()}:${val}`);
        }
      }
      currentAgents = [];
    }
  }
  return blocks;
}

function robotsBlocksAll(txt: string | null): boolean {
  if (!txt) return false;
  const blocks = parseRobotsTxt(txt);
  const star = blocks.get("*") || [];
  const disallowAll = star.some((d) => d === "disallow:/");
  if (!disallowAll) return false;
  const googlebot = blocks.get("Googlebot") || [];
  if (googlebot.some((d) => d.startsWith("allow:"))) return false;
  return true;
}

function blockedAICrawlers(txt: string | null): string[] {
  if (!txt) return [];
  const blocks = parseRobotsTxt(txt);
  return AI_CRAWLERS.filter((name) => {
    const rules = blocks.get(name);
    return rules && rules.some((r) => r === "disallow:/");
  });
}

const BUSINESS_TYPES = new Set([
  "LocalBusiness", "Organization", "Store", "Restaurant", "Hotel",
  "MedicalBusiness", "Dentist", "LegalService", "FinancialService",
  "RealEstateAgent", "HealthAndBeautyBusiness", "SportsActivityLocation",
  "EntertainmentBusiness", "FoodEstablishment", "ProfessionalService",
  "FAQPage", "Product", "Service", "WebSite", "WebPage",
]);

interface LdObject {
  type: string;
  name?: string;
  telephone?: string;
  address?: unknown;
}

function parseLdBlocks(html: string): LdObject[] {
  const results: LdObject[] = [];
  const ldBlocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of ldBlocks) {
    try {
      const obj = JSON.parse(block[1]);
      if (obj["@type"] && BUSINESS_TYPES.has(obj["@type"])) {
        results.push({ type: obj["@type"], name: obj.name, telephone: obj.telephone, address: obj.address });
      }
      if (Array.isArray(obj["@graph"])) {
        for (const item of obj["@graph"]) {
          if (item["@type"] && BUSINESS_TYPES.has(item["@type"])) {
            results.push({ type: item["@type"], name: item.name, telephone: item.telephone, address: item.address });
          }
        }
      }
    } catch { /* broken JSON */ }
  }
  return results;
}

function searchChecks(html: string, data: PageData): Check[] {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? "";
  const clean = stripScriptsAndComments(html);
  const checks: Check[] = [];

  const titleMatch = head.match(/<title>([\s\S]*?)<\/title>/i);
  const titleRaw = titleMatch ? decodeEntities(titleMatch[1].trim()) : "";
  const titleLen = titleRaw.length;
  let titleStatus: Status = "pass";
  if (!titleRaw) titleStatus = "fail";
  else if (titleLen < 15 || titleLen > 70) titleStatus = "warn";
  checks.push({
    id: "title", label: "Page title",
    detail: cap(titleRaw ? `Title: ${titleRaw}` : "No <title> tag found", 220),
    why: "Search engines show the title in results; a good title brings more clicks",
    fix: "Add a unique, descriptive <title> between 15 and 70 characters",
    impact: 3, status: titleStatus, standard: "Google Search Essentials",
  });

  const desc = metaContent(html, "description");
  let descStatus: Status = "pass";
  if (!desc) descStatus = "fail";
  else if (desc.length < 50 || desc.length > 160) descStatus = "warn";
  checks.push({
    id: "description", label: "Meta description",
    detail: cap(desc ? `Description: ${desc}` : "No meta description found", 220),
    why: "Search engines often show the description below the title in results",
    fix: "Add a <meta name=\"description\"> between 50 and 160 characters summarising the page",
    impact: 2, status: descStatus, standard: "Google Search Essentials",
  });

  const h1Count = countH1(html);
  let h1Status: Status = "pass";
  if (h1Count === 0) h1Status = "fail";
  else if (h1Count > 1) h1Status = "warn";
  checks.push({
    id: "h1", label: "Main heading (H1)",
    detail: h1Count === 0 ? "No <h1> heading found" : h1Count === 1 ? "One <h1> heading found" : `${h1Count} <h1> headings found; one is ideal`,
    why: "The H1 tells search engines and visitors what the page is about",
    fix: h1Count === 0 ? "Add one <h1> heading that describes the page" : "Reduce to a single <h1>; use <h2>-<h6> for sub-sections",
    impact: 2, status: h1Status, standard: "Google Search Essentials",
  });

  const robotsMeta = metaContent(html, "robots");
  const googlebotMeta = metaContent(html, "googlebot");
  const xRobotsTag = data.headers["x-robots-tag"] ?? "";
  const hasNoindex = /noindex/i.test(robotsMeta ?? "") || /noindex/i.test(googlebotMeta ?? "") || /noindex/i.test(xRobotsTag);
  const blockedByRobots = robotsBlocksAll(data.robotsTxt);
  let indexableStatus: Status = "pass";
  if (hasNoindex || blockedByRobots) indexableStatus = "fail";
  checks.push({
    id: "indexable", label: "Search engine indexing",
    detail: hasNoindex ? "A noindex directive is blocking search engines" : blockedByRobots ? "robots.txt blocks all crawlers from the site" : "Page is indexable by search engines",
    why: "A noindex tag or blanket robots.txt block keeps the page out of search results entirely",
    fix: "Remove the noindex meta tag or open robots.txt to allow crawling",
    impact: 3, status: indexableStatus, standard: "Google Search Essentials",
  });

  checks.push({
    id: "robots-txt", label: "robots.txt",
    detail: data.robotsTxt != null ? "robots.txt is present" : "No robots.txt found",
    why: "robots.txt tells crawlers which parts of the site to visit or skip",
    fix: "Add a robots.txt at the root of the site with sensible rules and a Sitemap line",
    impact: 1, status: data.robotsTxt != null ? "pass" : "warn", standard: "RFC 9309 (robots.txt)",
  });

  checks.push({
    id: "sitemap", label: "XML sitemap",
    detail: data.sitemapFound ? "Sitemap found" : "No sitemap found",
    why: "A sitemap helps search engines discover and index every important page",
    fix: "Create a sitemap.xml listing all public pages and reference it in robots.txt",
    impact: 1, status: data.sitemapFound ? "pass" : "warn", standard: "Google Search Essentials",
  });

  const hasCanonical = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(head);
  checks.push({
    id: "canonical", label: "Canonical URL",
    detail: hasCanonical ? "Canonical URL is set" : "No canonical link found",
    why: "A canonical tag tells search engines which version of the page is the original, preventing duplicate-content issues",
    fix: "Add <link rel=\"canonical\" href=\"...\"> pointing to the preferred URL",
    impact: 1, status: hasCanonical ? "pass" : "warn", standard: "Google Search Essentials",
  });

  const hasLang = /<html[^>]*\slang=["'][^"']+["']/i.test(html);
  checks.push({
    id: "language", label: "Page language",
    detail: hasLang ? "Language attribute is set" : "No lang attribute on <html>",
    why: "The lang attribute helps search engines serve the page to the right audience and improves screen-reader pronunciation",
    fix: "Add lang=\"en\" (or the correct language code) to the <html> tag",
    impact: 1, status: hasLang ? "pass" : "warn", standard: "WCAG 2.1 (3.1.1)",
  });

  const ogTitle = metaPropContent(html, "og:title");
  const ogImage = metaPropContent(html, "og:image");
  let ogStatus: Status = "pass";
  if (!ogTitle || !ogImage) ogStatus = "warn";
  checks.push({
    id: "open-graph", label: "Social preview (Open Graph)",
    detail: ogTitle && ogImage ? "Open Graph title and image are set" : `Missing: ${[!ogTitle && "og:title", !ogImage && "og:image"].filter(Boolean).join(", ")}`,
    why: "Open Graph tags control how the page looks when shared on social media and messaging apps",
    fix: "Add <meta property=\"og:title\"> and <meta property=\"og:image\"> in the <head>",
    impact: 1, status: ogStatus, standard: "Open Graph Protocol",
  });

  const imgs = [...clean.matchAll(/<img\s[^>]*>/gi)];
  const missingAlt = imgs.filter((m) => !/\salt=["']/i.test(m[0]));
  let altStatus: Status = "pass";
  if (missingAlt.length > 0) altStatus = "warn";
  checks.push({
    id: "image-alt", label: "Image alt text",
    detail: imgs.length === 0 ? "No images found" : missingAlt.length === 0 ? `All ${imgs.length} images have alt text` : `${missingAlt.length} of ${imgs.length} images missing alt text`,
    why: "Alt text helps screen readers describe images and gives search engines content to index",
    fix: "Add descriptive alt attributes to every <img>; use alt=\"\" for purely decorative images",
    impact: 2, status: altStatus, standard: "WCAG 2.1 (1.1.1)",
  });

  const ldObjects = parseLdBlocks(html);
  const hasValidLd = ldObjects.length > 0;
  checks.push({
    id: "structured-data", label: "Structured data",
    detail: hasValidLd ? "Valid structured data found" : "No recognised structured data",
    why: "Structured data can earn rich results in Google (star ratings, prices, FAQs), which boost click-through",
    fix: "Add a JSON-LD script with your business type, name, and address using schema.org vocabulary",
    impact: 2, status: hasValidLd ? "pass" : "warn", standard: "schema.org / Google Rich Results",
  });

  let schemaStatus: Status = "info";
  let schemaDetail = "No structured data to check";
  if (ldObjects.length > 0) {
    const complete = ldObjects.some((o) => o.name && (o.telephone || o.address));
    if (complete) {
      schemaStatus = "pass";
      schemaDetail = "Structured data includes name and contact details";
    } else {
      schemaStatus = "warn";
      schemaDetail = ldObjects.some((o) => o.name)
        ? "Structured data has a name but is missing phone or address"
        : "Structured data is missing required fields (name, phone, address)";
    }
  }
  checks.push({
    id: "schema-complete", label: "Schema completeness",
    detail: schemaDetail,
    why: "Complete structured data with name, phone, and address earns richer search results",
    fix: "Add name, telephone, and address fields to your JSON-LD structured data",
    impact: 2, status: schemaStatus, standard: "schema.org / Google Rich Results",
  });

  const anchorHrefs = [...clean.matchAll(/<a\s[^>]*href=["']([^"']*)["']/gi)];
  const badLinks = anchorHrefs.filter((m) => m[1] === "" || /^javascript:/i.test(m[1]));
  checks.push({
    id: "link-health", label: "Link quality",
    detail: badLinks.length > 0 ? `${badLinks.length} link(s) use empty or javascript: hrefs` : "All links have valid destinations",
    why: "Empty or javascript: links confuse search engines and break keyboard navigation",
    fix: "Replace empty hrefs with proper URLs and javascript: links with buttons or real navigation",
    impact: 1, status: badLinks.length > 0 ? "warn" : "pass", standard: "Google Search Essentials",
  });

  return checks;
}

function aiChecks(data: PageData): Check[] {
  const checks: Check[] = [];

  checks.push({
    id: "llms-txt", label: "llms.txt",
    detail: data.llmsTxtFound ? "llms.txt is present" : "No llms.txt found — an opportunity to help AI tools understand your site",
    why: "llms.txt is a proposed standard that helps large language models understand what a site offers",
    fix: "Create a /llms.txt file summarising your business, services, and key pages in plain language",
    impact: 1, status: data.llmsTxtFound ? "pass" : "info", standard: "llms-txt proposal (llmstxt.org)",
  });

  const blocked = blockedAICrawlers(data.robotsTxt);
  checks.push({
    id: "ai-crawlers", label: "AI crawler access",
    detail: blocked.length > 0 ? `Blocked AI crawlers: ${blocked.join(", ")}` : "No AI crawlers are blocked",
    why: "Blocking AI crawlers prevents your content from appearing in AI-powered answers and recommendations",
    fix: "Review your robots.txt rules for AI user-agents and decide if blocking them helps or hurts your visibility",
    impact: 1, status: blocked.length > 0 ? "info" : "pass", standard: "RFC 9309 (robots.txt)",
  });

  return checks;
}

function enquiryChecks(html: string): Check[] {
  const checks: Check[] = [];
  const clean = stripScriptsAndComments(html);

  const waLink = /href=["'](https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/|whatsapp:\/\/)/i.test(clean);
  checks.push({
    id: "whatsapp", label: "WhatsApp link",
    detail: waLink ? "WhatsApp link found" : "No WhatsApp link found",
    why: "In India and many markets, WhatsApp is the fastest way a visitor can reach a business",
    fix: "Add a link to https://wa.me/<your-number> on every page",
    impact: 2, status: waLink ? "pass" : "warn", standard: "Industry best practice",
  });

  const telLink = /href=["']tel:/i.test(clean);
  checks.push({
    id: "tap-to-call", label: "Tap-to-call link",
    detail: telLink ? "Phone link found" : "No tel: link found",
    why: "A tap-to-call link lets mobile visitors phone you in one tap without copying a number",
    fix: "Add <a href=\"tel:+91XXXXXXXXXX\">Call us</a> with your business number",
    impact: 1, status: telLink ? "pass" : "warn", standard: "Google Search Essentials",
  });

  const hasForm = /<form[\s>]/i.test(clean);
  const hasEmail = /href=["']mailto:/i.test(clean);
  const hasAnyContact = waLink || telLink || hasForm || hasEmail;
  checks.push({
    id: "contact-route", label: "Contact method",
    detail: hasAnyContact ? "At least one contact method found" : "No way to contact the business found on this page",
    why: "If a visitor cannot find a way to contact you, they leave and go to a competitor",
    fix: "Add a contact form, email link, phone number, or WhatsApp link to every page",
    impact: 3, status: hasAnyContact ? "pass" : "fail", standard: "Google Search Essentials",
  });

  return checks;
}

function trustChecks(html: string, data: PageData, now: Date): Check[] {
  const checks: Check[] = [];
  const clean = stripScriptsAndComments(html);

  const isHttps = data.finalUrl.startsWith("https://") || data.finalUrl.startsWith("https%3A");
  checks.push({
    id: "https", label: "HTTPS",
    detail: isHttps ? "Site is served over HTTPS" : "Site is not using HTTPS",
    why: "Browsers mark HTTP sites as Not Secure, which scares visitors and hurts search ranking",
    fix: "Install an SSL certificate and redirect all HTTP traffic to HTTPS",
    impact: 3, status: isHttps ? "pass" : "fail", standard: "Google Search Essentials",
  });

  const mixedRe = /<(?:img|script|link|iframe|source|video|audio|embed|object)\s[^>]*(?:src|href)=["']http:\/\//gi;
  const mixedMatches = [...html.matchAll(mixedRe)];
  checks.push({
    id: "mixed-content", label: "Mixed content",
    detail: mixedMatches.length > 0 ? `${mixedMatches.length} resource(s) loaded over plain HTTP on an HTTPS page` : "No mixed content found",
    why: "Browsers block or warn about HTTP resources on HTTPS pages, breaking images, scripts, and styles",
    fix: "Change all resource URLs to https:// or use protocol-relative // URLs",
    impact: 2, status: mixedMatches.length > 0 ? "warn" : "pass", standard: "OWASP Security Guidelines",
  });

  const privacyRe = /href=["'][^"']*priv(?:acy|ate)[^"']*["']/i;
  const privacyTextRe = />(?:[^<]*privacy[^<]*)</i;
  const hasPrivacy = privacyRe.test(clean) || privacyTextRe.test(clean);
  checks.push({
    id: "privacy-policy", label: "Privacy policy",
    detail: hasPrivacy ? "Privacy policy link found" : "No privacy policy link found",
    why: "A privacy policy is legally required in most jurisdictions and builds visitor trust",
    fix: "Add a link to your privacy policy in the footer of every page",
    impact: 2, status: hasPrivacy ? "pass" : "warn", standard: "GDPR / IT Act 2000",
  });

  const crMatch = html.match(/(?:©|&copy;|©|Copyright)\s*(\d{4})(?:\s*[-–]\s*(\d{4}))?/i);
  if (crMatch) {
    const latestYear = parseInt(crMatch[2] || crMatch[1], 10);
    const currentYear = now.getUTCFullYear();
    const isStale = currentYear - latestYear > 2;
    checks.push({
      id: "copyright-year", label: "Copyright year",
      detail: isStale ? `Copyright year (${latestYear}) is more than two years old` : "Copyright year is up to date",
      why: "An old copyright year makes the site look abandoned, even if it is actively maintained",
      fix: "Update the copyright year in the footer to the current year",
      impact: 1, status: isStale ? "warn" : "pass", standard: "Industry best practice",
    });
  }

  const SEC_HEADERS = [
    "strict-transport-security", "x-content-type-options", "x-frame-options",
    "content-security-policy", "referrer-policy", "permissions-policy",
  ];
  const present = SEC_HEADERS.filter((h) => data.headers[h]);
  checks.push({
    id: "security-headers", label: "Security headers",
    detail: `${present.length} of ${SEC_HEADERS.length} recommended security headers set`,
    why: "Security headers protect visitors from clickjacking, MIME sniffing, and other common attacks",
    fix: `Add these headers: ${SEC_HEADERS.filter((h) => !data.headers[h]).join(", ") || "all present"}`,
    impact: 2, status: present.length >= 3 ? "pass" : "warn", standard: "OWASP Secure Headers Project",
  });

  return checks;
}

function performanceChecks(html: string, data: PageData): Check[] {
  const checks: Check[] = [];

  const ok = data.status >= 200 && data.status < 400;
  checks.push({
    id: "homepage-loads", label: "Homepage loads",
    detail: `Page returned HTTP ${data.status}`,
    why: "A homepage that errors out loses every visitor and signals to search engines that the site is broken",
    fix: "Fix the server error so the homepage returns a 200 status code",
    impact: 3, status: ok ? "pass" : "fail", standard: "Google Search Essentials",
  });

  const vpMeta = metaContent(html, "viewport");
  const hasDeviceWidth = vpMeta ? /width=device-width/i.test(vpMeta) : false;
  checks.push({
    id: "viewport", label: "Mobile viewport",
    detail: hasDeviceWidth ? "Viewport is set for mobile" : vpMeta ? "Viewport is set but does not use device-width" : "No viewport meta tag found",
    why: "Without a proper viewport tag, mobile browsers zoom out to fit a desktop layout, making the site unusable on phones",
    fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to the <head>",
    impact: 3, status: hasDeviceWidth ? "pass" : "fail", standard: "Google Search Essentials",
  });

  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] ?? "";
  const headScripts = [...head.matchAll(/<script\s[^>]*>/gi)];
  const blockingScripts = headScripts.filter((m) => {
    const tag = m[0];
    if (!/src=/i.test(tag)) return false;
    if (/type=["']application\/ld\+json["']/i.test(tag)) return false;
    if (/type=["']module["']/i.test(tag)) return false;
    // nomodule scripts are the legacy fallback to type="module"; modern
    // browsers never download or run them, so they don't block rendering.
    if (/\bnomodule\b/i.test(tag)) return false;
    if (/\b(?:defer|async)\b/i.test(tag)) return false;
    return true;
  });
  checks.push({
    id: "render-blocking", label: "Render-blocking scripts",
    detail: blockingScripts.length > 0
      ? `${blockingScripts.length} script(s) in <head> block rendering`
      : "No render-blocking scripts in <head>",
    why: "Scripts without defer or async pause page rendering, making the page appear slower to visitors and search engines",
    fix: "Add defer or async to <script> tags in the <head>, or move them before </body>",
    impact: 2, status: blockingScripts.length > 0 ? "warn" : "pass", standard: "Google PageSpeed Insights",
  });

  const clean = stripScriptsAndComments(html);
  const allImgs = [...clean.matchAll(/<img\s[^>]*>/gi)];
  const missingDims = allImgs.filter((m) => !/\bwidth=/i.test(m[0]) || !/\bheight=/i.test(m[0]));
  let dimStatus: Status = "pass";
  if (allImgs.length > 0 && missingDims.length > 0) dimStatus = "warn";
  checks.push({
    id: "image-dimensions", label: "Image dimensions",
    detail: allImgs.length === 0
      ? "No images found"
      : missingDims.length === 0
        ? `All ${allImgs.length} images have width and height`
        : `${missingDims.length} of ${allImgs.length} images missing width/height`,
    why: "Images without explicit dimensions cause layout shift (CLS) as the page loads, which hurts user experience and Core Web Vitals scores",
    fix: "Add width and height attributes to every <img> tag to reserve space before the image loads",
    impact: 2, status: dimStatus, standard: "Core Web Vitals (CLS)",
  });

  return checks;
}

function accessibilityChecks(html: string): Check[] {
  const checks: Check[] = [];
  const clean = stripScriptsAndComments(html);

  const headings = [...clean.matchAll(/<h([1-6])[\s>]/gi)];
  let ordered = true;
  let prevLevel = 0;
  for (const m of headings) {
    const level = parseInt(m[1], 10);
    if (prevLevel > 0 && level > prevLevel + 1) { ordered = false; break; }
    prevLevel = level;
  }
  checks.push({
    id: "heading-order", label: "Heading hierarchy",
    detail: ordered ? "Headings follow a logical order" : "Heading levels are skipped (e.g. h1 to h3)",
    why: "A logical heading hierarchy helps screen readers navigate and helps search engines understand the page structure",
    fix: "Use headings in order: h1 first, then h2 for sub-sections, h3 within those, etc.",
    impact: 2, status: ordered ? "pass" : "warn", standard: "WCAG 2.1 (1.3.1)",
  });

  const formEls = [...clean.matchAll(/<(?:input|textarea|select)\s[^>]*>/gi)];
  const labelable = formEls.filter((m) => {
    const tag = m[0].toLowerCase();
    if (tag.startsWith("<input")) {
      const t = tag.match(/type=["']([^"']*)["']/);
      const type = t ? t[1].toLowerCase() : "text";
      return !["hidden", "submit", "button", "reset", "image"].includes(type);
    }
    return true;
  });
  const labelFors = new Set<string>();
  for (const m of clean.matchAll(/<label[^>]*\sfor=["']([^"']*)["']/gi)) labelFors.add(m[1]);
  let unlabeled = 0;
  for (const m of labelable) {
    if (/aria-label(?:ledby)?=/i.test(m[0])) continue;
    const idMatch = m[0].match(/\sid=["']([^"']*)["']/i);
    if (idMatch && labelFors.has(idMatch[1])) continue;
    unlabeled++;
  }
  checks.push({
    id: "form-labels", label: "Form labels",
    detail: labelable.length === 0 ? "No form inputs found" : unlabeled > 0 ? `${unlabeled} form input(s) without a label` : "All form inputs have labels",
    why: "Labels tell screen readers and voice-control users what each form field is for",
    fix: "Add a <label for=\"id\"> for every form input, or use aria-label as a fallback",
    impact: 2, status: unlabeled > 0 ? "warn" : "pass", standard: "WCAG 2.1 (1.3.1, 4.1.2)",
  });

  return checks;
}

export function analyzePage(data: PageData, now: Date): Category[] {
  const html = data.html ?? "";
  return [
    { id: "search", label: "Search visibility", checks: searchChecks(html, data) },
    { id: "ai", label: "AI readiness", checks: aiChecks(data) },
    { id: "enquiries", label: "Enquiry routes", checks: enquiryChecks(html) },
    { id: "trust", label: "Trust and safety", checks: trustChecks(html, data, now) },
    { id: "performance", label: "Performance", checks: performanceChecks(html, data) },
    { id: "accessibility", label: "Accessibility", checks: accessibilityChecks(html) },
  ];
}

export function summarize(cats: Category[]): Summary {
  const all = cats.flatMap((c) => c.checks);
  const countable = all.filter((c) => c.status !== "info");
  const passed = countable.filter((c) => c.status === "pass").length;
  const gaps = countable
    .filter((c) => c.status === "fail" || c.status === "warn")
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);
  return { total: countable.length, passed, gaps };
}
