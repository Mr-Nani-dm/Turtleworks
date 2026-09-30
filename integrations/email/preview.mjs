// Writes sample emails to ./preview/*.html so you can open them in a browser.
//   node preview.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderEmail } from "./template.mjs";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "preview");
mkdirSync(dir, { recursive: true });

const samples = {
  "1-acknowledgement": renderEmail({
    preheader: "Your message has reached us. Reference TW-20260930-AB12.",
    title: "We've received your enquiry",
    greeting: "Hi Asha,",
    paragraphs: [
      "Thank you for getting in touch with TurtleWorks. Your message has reached us, and we'll read it properly and reply personally to arrange a conversation.",
      "If anything is time-sensitive, simply reply to this email.",
    ],
    reference: { label: "Your reference", value: "TW-20260930-AB12" },
    footerNote: "You are receiving this email because you sent an enquiry through turtleworks.in.",
  }),
  "2-welcome-menu": renderEmail({
    preheader: "Welcome to TurtleWorks. What would you like help with?",
    title: "Welcome to TurtleWorks",
    greeting: "Hi Vikram, welcome to TurtleWorks. Thanks for reaching out.",
    paragraphs: [
      "We help businesses with websites, automation, dashboards, FinOps visibility, SEO, and digital workflows.",
      "What would you like help with?\n1. Website design\n2. Business automation\n3. Dashboard / FinOps\n4. SEO / content\n5. Not sure, need guidance",
    ],
    footerNote: "You are receiving this email because you wrote to hello@turtleworks.in.",
  }),
  "3-follow-up": renderEmail({
    preheader: "Just checking in. Reply whenever suits you.",
    title: "Following up",
    greeting: "Hi Vikram,",
    paragraphs: ["Just checking in. Happy to continue whenever suits you. Just reply here and we'll pick up where we left off."],
    footerNote: "You are receiving this email because you wrote to hello@turtleworks.in.",
    optOut: true,
  }),
  "4-draft-reply": renderEmail({
    preheader: "Thanks for your enquiry.",
    title: "Re: your enquiry to TurtleWorks",
    greeting: "Hi Asha,",
    paragraphs: [
      "Thanks for reaching out. It sounds like your bakery's website is not bringing in online orders the way you'd like.",
      "Could we set up a short call to understand it better? Which days suit you? Is there a website today?",
      "Best regards,\nTurtleWorks",
    ],
    footerNote: "You are receiving this email because you sent an enquiry through turtleworks.in.",
  }),
};

for (const [name, html] of Object.entries(samples)) writeFileSync(path.join(dir, `${name}.html`), html);
console.log("wrote", Object.keys(samples).length, "previews to", dir);
