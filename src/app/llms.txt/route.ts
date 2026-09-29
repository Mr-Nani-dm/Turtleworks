import { site } from "@/data/site";
import { serviceGroups } from "@/data/services";
import { processSteps } from "@/data/process";
import { faqs } from "@/data/faq";
import { proof } from "@/data/work";

/*
  /llms.txt — a plain-text summary for AI assistants and answer engines (GEO).
  Generated from the same data as the page, so it never drifts from the site.
*/
export const dynamic = "force-static";

export function GET() {
  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.description}`,
    "",
    `${site.name} is a ${site.descriptor.toLowerCase()}${site.location ? ` based in ${site.location}` : ""}. Website: ${site.url}`,
    "",
    "## Services",
    ...serviceGroups.flatMap((group) => [
      "",
      `### ${group.title}`,
      group.summary,
      ...group.services.map(
        (s) => `- **${s.title}**: ${s.plain} (Includes: ${s.includes.join(", ")}.)`,
      ),
    ]),
    "",
    "## Our own work",
    ...proof.flatMap((item) => [`- **${item.title}**: ${item.body}`, ...item.facts.map((f) => `  - ${f}`)]),
    "",
    "## How we work",
    ...processSteps.map((step) => `- **${step.title}**: ${step.body} You get: ${step.youGet}`),
    "",
    "## Frequently asked questions",
    ...faqs.flatMap((f) => ["", `### ${f.question}`, f.answer]),
    "",
    "## Contact",
    `- Enquiries: ${site.url}/#contact`,
    ...(site.email ? [`- Email: ${site.email}`] : []),
    ...(site.whatsappUrl ? [`- WhatsApp: ${site.whatsappUrl.split("?")[0]}`] : []),
    ...(site.bookingUrl ? [`- Book a call: ${site.bookingUrl}`] : []),
    "",
    "## Pages",
    `- [Home](${site.url})`,
    `- [Privacy notice](${site.url}/privacy)`,
    `- [Terms](${site.url}/terms)`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
