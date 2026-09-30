# TurtleWorks branded email

One layout for everything customer-facing: a forest-green header band with the logo and company name, a white body, and a quiet footer, the same structure as a Google Cloud notification.

| Email | Where | Layout |
|---|---|---|
| Enquiry acknowledgement (first-time visitors) | TW-01 | Full branded layout, with the enquiry reference in its own box |
| AI draft reply saved in Gmail Drafts | TW-05 | Full layout; you read and edit it before sending |
| Proposal and invoice reminders saved as drafts | TW-07 | Full layout; drafts only, never sent automatically |
| Replies to people who email `hello@` | TW-08 | Full layout, threaded into their conversation |
| The one automatic follow-up by email | TW-09 | Full layout plus a "Reply STOP" line |
| Replies you type by hand in Gmail | Gmail | Matching **signature** (`signature.html`), not a banner |
| Team alerts and error emails | TW-01, TW-08, TW-09 and others | **Plain text on purpose**: read at a glance and replied to |

The full banner sits on automated and transactional mail. A personal reply from a person should look like a person wrote it, so hand-typed replies get the compact signature with the same logo and colours.

## Files

| File | Purpose |
|---|---|
| `template.mjs` | The layout. Pure function `renderEmail({ preheader, title, greeting, paragraphs, reference, cta, footerNote, optOut })`. Everything a visitor can influence is escaped; only https, mailto and tel links are emitted |
| `template.test.mjs` | 18 checks: escaping, hostile input, links, table structure, WCAG AA contrast for every colour pair, size |
| `workflows.test.mjs` | 10 checks that run the code embedded in the n8n workflows against hostile input and confirm wiring, and that team alerts stay plain text |
| `preview.mjs` | Writes sample emails to `preview/` so you can open them in a browser |
| `signature.html` | Gmail signature (see below) |

Run the tests with `node --test integrations/email/*.test.mjs`. After changing `template.mjs`, regenerate the workflows: `node integrations/n8n/build-core.mjs`, then `node integrations/n8n/lead-hub/build-hub.mjs`, and re-import the changed workflows into n8n. n8n Code nodes cannot import files, so the template is embedded into each "Brand ..." node at build time.

## Gmail signature for replies you type

1. Edit the name in `signature.html`.
2. Open the file in Chrome, select the signature block, and copy it.
3. Gmail, Settings (gear), See all settings, General, Signature, Create new, paste, Save.

## How it is built, and why

- **Tables and inline styles, 600px wide.** Gmail, Outlook and phone apps all handle it; on phones it stretches to full width and the button becomes full-width.
- **The company name is live text next to the logo.** Outlook blocks images until the reader allows them, and the header still reads.
- **Light theme only** (`color-scheme: light`), with a solid header colour, so dark-mode apps do not turn it into something illegible.
- **A hidden preview line** so the inbox list shows a useful sentence instead of the first words of the header.
- **No tracking pixels, no external CSS, no scripts.**
- **No invented footer details.** It says why the email arrived and how to reach you. A registered name or postal address is not shown because none is configured; add one in the footer of `template.mjs` if you want it (some countries expect it on marketing mail).

## Known limits

- **n8n's Gmail node sends the HTML alone**, without a separate plain-text version. That is fine for transactional mail, but if you ever see these landing in spam, this is the first thing to look at.
- **Not tested in Outlook desktop.** It is built to the usual Outlook rules (tables, no CSS layout tricks), but the only rendering checked here is Chrome at desktop and phone width. Send yourself a test to Gmail and an Outlook account after the first import.
- **The logo is loaded from `www.turtleworks.in/brand/turtleworks-mark.png`.** If that file is renamed or moved, every email loses its logo. Keep the path.

## Deliverability check (done 30 Sep 2026)

Mail is on Google Workspace. SPF includes Google's servers, DKIM (`google._domainkey`) is published, and DMARC is set to `p=quarantine` with reports going to a GoDaddy address. This is the setup that keeps these emails out of spam. Once mail has flowed for a few weeks, consider moving DMARC reports to an address you read.
