# TurtleWorks

**Business Solutions & Technology Partner** — a premium, cinematic marketing
site. We understand the problem first, then design the right mix of
technology, automation, digital experience and business solutions around what
a business actually needs.

Production: https://turtleworks.in

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS-first `@theme` tokens in `src/app/globals.css`)
- Self-hosted variable fonts (**Manrope** display / **Inter** body) — no external requests
- Static pages; one dynamic route (`/api/contact`)
- CI (GitHub Actions): lint → build → smoke test on every push and PR

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Configuration

Set these in **Vercel → Project → Settings → Environment Variables**, then
**redeploy** (pages are static, so changes only apply to a new build).
A copy with comments lives in `.env.example`.

| Variable | Required | Purpose |
|---|---|---|
| `CONTACT_WEBHOOK_URL` | one delivery option | Enquiries are POSTed here as JSON (n8n, Make, Zapier, Formspree…) |
| `CONTACT_WEBHOOK_SECRET` | optional | Sent as the `x-contact-secret` header so your webhook can verify the source |
| `RESEND_API_KEY` + `CONTACT_TO_EMAIL` | other delivery option | Email enquiries via [Resend](https://resend.com) |
| `CONTACT_FROM_EMAIL` | with Resend | Verified sender, e.g. `TurtleWorks <site@turtleworks.in>` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | recommended | Public inbox shown as a direct-email option (never guessed) |
| `NEXT_PUBLIC_LEGAL_NAME` | recommended | Registered/trading entity — footer, privacy notice, JSON-LD |
| `NEXT_PUBLIC_LOCATION` | recommended | Where you operate from, e.g. "Hyderabad, India" |
| `NEXT_PUBLIC_BOOKING_URL` | optional | Cal.com / Calendly link — shows "Book a call" |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical origin. Defaults to `https://turtleworks.in` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | optional | `1` to load Vercel Web Analytics (enable it in the dashboard first) |

**Until a delivery option is set, the enquiry form stays hidden in
production** so no message is ever lost.

**Spam protection:** the API has a honeypot, a minimum fill time, same-origin
checks, a 20 KB body cap and a per-instance rate limit. For real flood
protection add a Vercel Firewall rule: *Project → Firewall → Add rule → path
`/api/contact`, method POST → Rate limit (e.g. 5 requests / 10 min per IP)*.

## Experience

- **Film** — desktop scroll-scrubs the 20-second TurtleWorks narrative (the
  revised cut ends with the turtle holding the viewer's gaze). Small screens
  play a lighter file slowly on a loop, with a pause control (floating, and in
  the footer). Reduced-motion and Data Saver visitors get the static poster and
  download no video.
- **Sections** — Hero, Solutions (capability index), More → Right, How We Work,
  How we engage, Engagement examples, Why TurtleWorks, Team (hidden until real
  data), FAQ, Contact (form + what happens next), Footer. Plus `/privacy`,
  `/terms`, confirmation pages and a branded 404.
- **Contact** — validated form → `/api/contact`; works without JavaScript.
- **Accessibility** — WCAG 2.2 AA-oriented: two-tone focus ring, in-page links
  move focus, modal mobile menu, form focus/error handling, reduced motion.
- **Security** — CSP (static-friendly, no nonces) and hardening headers in
  `next.config.ts`.
- **SEO** — per-page canonical/OpenGraph, `sitemap.xml`, `robots.txt`,
  Organization and FAQ JSON-LD.

## Film files

`public/videos/turtle-{desktop,mobile}-v2.{webm,mp4}` and `poster-v2.jpg` are
committed, optimised encodes of the revised cut (desktop keyframe every 0.5 s
so scroll-scrubbing seeks smoothly). They're cached for 30 days, so a new cut
must use a **new filename** (`-v3`) and be referenced in `src/data/site.ts`.

## Project structure

```
src/
  app/            layout, page, globals.css, sitemap, robots, icon, api/contact,
                  privacy, terms, thanks, not-found
  components/     layout · motion · sections · ui
  data/           services · process · work · site · engagement · faq · team
  hooks/          useMediaQuery · useReducedMotion · useIntersectionReveal · useScrollVideo
  lib/            seo · fonts · contact-schema · contact-delivery
public/
  videos/         turtle-{desktop,mobile}-v2.{webm,mp4} · poster-v2.jpg
  brand/          turtleworks-mark.png
  og.jpg          1200×630 social preview
```

## Content rules

The items in `src/data/work.ts` are explicitly marked **illustrative
placeholders** — not customer case studies, metrics or endorsements. Replace
them only with approved work. The team list stays empty (section hidden) until
real people are added with their consent.

## Production checklist

1. Set a contact delivery option and `NEXT_PUBLIC_CONTACT_EMAIL`; add legal name and location.
2. Redeploy, then send a test enquiry from the live form.
3. Add the Vercel Firewall rate-limit rule for `/api/contact`.
4. Run Lighthouse / Core Web Vitals on the production URL.
5. Check Safari, iPhone and Android video framing and scroll behaviour.
6. Have the privacy notice and terms reviewed for your jurisdiction.

## License

Proprietary — © TurtleWorks. All rights reserved.
