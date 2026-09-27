# TurtleWorks

**Business Solutions & Technology Partner** — a premium, cinematic single-page
marketing site. We understand the problem first, then design the right mix of
technology, automation, digital experience and business solutions around what a
business actually needs.

## Stack

- Next.js 16 (App Router), React 19 and TypeScript
- Tailwind CSS v4
- Self-hosted Manrope and Inter variable fonts
- Static prerendering for the public marketing routes

## Getting started

1. Run npm install.
2. Set NEXT_PUBLIC_CONTACT_EMAIL to the real public TurtleWorks inbox.
3. Run npm run dev for local development.
4. Run npm run lint and npm run build before release.

The application intentionally does not publish a guessed email address when
NEXT_PUBLIC_CONTACT_EMAIL is absent.

## Experience

- Desktop scroll-scrubs the 20-second TurtleWorks turtle narrative.
- Mobile uses the lighter video asset with restrained ambient playback.
- Reduced-motion users receive the static poster and do not mount the hero video.
- Sections: Hero, Solutions, How We Work, Selected Work, Why TurtleWorks,
  Contact and Footer.
- Brand: Forest/Evergreen greens, Ivory and restrained gold accents derived from
  the official TurtleWorks logo.
- SEO uses the production canonical https://turtleworks.in plus OpenGraph,
  Twitter metadata, sitemap, robots and Organization JSON-LD.
- Baseline production security headers and media caching are configured in
  next.config.ts.

## Project structure

src/app — layout, page, styles, sitemap, robots and icon
src/components — layout, motion, sections and UI
src/data — services, process, work and site configuration
src/hooks — media queries, reduced motion, reveals and scroll video
src/lib — SEO and fonts
public/videos — desktop video, mobile video and poster
public/brand — official mark and cinematic key art

## Content integrity

The items in src/data/work.ts are explicitly marked illustrative placeholders.
They are not named customer case studies, fabricated metrics or client
endorsements. Replace them only with approved work.

## Production checklist

Before launch:

1. Configure NEXT_PUBLIC_CONTACT_EMAIL with the real public inbox.
2. Deploy a preview on the production hosting platform.
3. Run Lighthouse and Core Web Vitals checks.
4. Check Safari, iPhone and Android video framing and scroll behavior.
5. Confirm HTTPS, DNS, analytics if used, and final legal/contact details.

## License

Proprietary — © TurtleWorks. All rights reserved.
