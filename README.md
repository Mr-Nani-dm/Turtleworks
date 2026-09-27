# TurtleWorks

**Business Solutions & Technology Partner** — a premium, cinematic single-page
marketing site. We understand the problem first, then design the right mix of
technology, automation, digital experience and business solutions around what a
business actually needs.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- Self-hosted variable fonts (**Manrope** display / **Inter** body) — no external requests
- Static export (all routes prerendered)

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Configuration (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Purpose |
|---|---|---|
| `CONTACT_WEBHOOK_URL` | one delivery option | Enquiries are POSTed here as JSON (n8n, Make, Zapier, Formspree…) |
| `CONTACT_WEBHOOK_SECRET` | optional | Sent as the `x-contact-secret` header so your webhook can verify the source |
| `RESEND_API_KEY` + `CONTACT_TO_EMAIL` | other delivery option | Email enquiries via [Resend](https://resend.com) |
| `CONTACT_FROM_EMAIL` | with Resend | Verified sender, e.g. `TurtleWorks <site@yourdomain>` |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical origin (defaults to the Vercel production URL) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | optional | Shows a direct-email option |
| `NEXT_PUBLIC_BOOKING_URL` | optional | Cal.com / Calendly link — shows "Book a call" |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | optional | `1` to load Vercel Web Analytics (enable it in the dashboard first) |

**Until a delivery option is set, the enquiry form stays hidden in production** so no message is ever lost. Redeploy after changing variables.

## What's here

- **Cinematic background** — an ambient, slow-playing (0.33×) turtle film, fixed
  and visible across the whole site, with a static poster fallback for
  `prefers-reduced-motion`. Desktop uses the full asset; small screens use a
  lighter mobile asset.
- **Sections** — Hero, Solutions (capability index), How We Work, Engagement
  examples, How we engage, Why TurtleWorks, Team (hidden until real data),
  FAQ, Contact (form + what happens next), Footer. Plus /privacy, /terms, 404.
- **Contact** — validated form → `/api/contact` (honeypot, min fill time,
  rate limit, same-origin check, works without JavaScript).
- **Security** — CSP and hardening headers in `next.config.ts`.
- **Brand** — Forest/Evergreen greens, Ivory, and a restrained **gold** accent
  (the shell-scute motif) echoing the official logo. Tokens in
  `src/app/globals.css`.
- **SEO** — metadata, canonical, OpenGraph/Twitter, `sitemap.xml`, `robots.txt`,
  Organization JSON-LD.

## Project structure

```
src/
  app/            layout, page, globals.css, sitemap, robots, icon
  components/     layout · motion · sections · ui
  data/           services · process · work · site · engagement · faq · team
  hooks/          useReducedMotion · useIntersectionReveal · useMediaQuery
  lib/            seo · fonts · contact-schema · contact-delivery
public/
  videos/         turtle-{desktop,mobile}.{webm,mp4} · poster.jpg
  brand/          turtleworks-mark.png · turtle-keyart.png
```

## Notes

- Set `NEXT_PUBLIC_SITE_URL` once you have a custom domain — it feeds the
  canonical URL, OpenGraph and sitemap.
- The three items in `src/data/work.ts` are **illustrative placeholders**
  (`placeholder: true`), not real client case studies. Replace with approved
  work when available — no fabricated clients, metrics, or logos.

## License

Proprietary — © TurtleWorks. All rights reserved.
