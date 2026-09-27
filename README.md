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

## What's here

- **Cinematic background** — an ambient, slow-playing (0.33×) turtle film, fixed
  and visible across the whole site, with a static poster fallback for
  `prefers-reduced-motion`. Desktop uses the full asset; small screens use a
  lighter mobile asset.
- **Sections** — Hero, Solutions (interactive capability index), How We Work,
  Selected Work, Why TurtleWorks, Contact, Footer.
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
  data/           services · process · work · site
  hooks/          useReducedMotion · useIntersectionReveal · useScrollVideo
  lib/            seo · fonts
public/
  videos/         turtle-desktop.mp4 · turtle-mobile.mp4 · poster.jpg
  brand/          turtleworks-mark.png · turtle-keyart.png
```

## Notes

- Set the production domain in `src/data/site.ts` (`site.url`) — it feeds the
  canonical URL, OpenGraph, and sitemap.
- The three items in `src/data/work.ts` are **illustrative placeholders**
  (`placeholder: true`), not real client case studies. Replace with approved
  work when available — no fabricated clients, metrics, or logos.

## License

Proprietary — © TurtleWorks. All rights reserved.
