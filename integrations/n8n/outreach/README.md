# TurtleWorks outbound WhatsApp outreach (TW-10 and TW-11)

Controlled WhatsApp outreach to a prospect list in Google Sheets, with YES / NO tracking, follow-ups at 2 and 5 days, and a hard stop when someone says no.

```
Prospects tab (Status = Outreach Ready)
   └─ TW-10, hourly 10:00-17:00 IST Mon-Sat ─> 3 sends per run, 70-140 s apart ─> Outreach Sent
        └─ 2 days quiet -> Follow-up 1 · 5 days -> Follow-up 2 · 7 days -> No Response (stops)

Prospect replies on WhatsApp ─> TW-08 hub spots the number is a prospect ─> TW-11 ─> YES / NO / price / call handling ─> team email
```

## Read this before sending anything

Cold outreach is the riskiest thing you can do on the WhatsApp Business Platform.

- **WhatsApp's business policy requires opt-in.** A first message to someone who never asked to hear from you is what gets numbers reported and blocked. Enough reports lower your quality rating, then your daily message limit, and can end with the number banned. That includes the number you use for inbound leads, because it is the same number.
- **Meta may reject the templates.** Business-initiated messages must be pre-approved templates in the Marketing category, and Meta can refuse copy that reads as cold sales outreach.
- **Each message costs money** (Marketing template rate on Meta's India rate card, per message). Follow-ups cost again.
- **Use a separate number** for outreach, not the number that handles inbound leads and not your personal one.

So the sender has a built-in brake: **`Contact Basis` must be filled in** (for example "Lists this WhatsApp number on their public website" or "Asked us for a quote"). If it is empty, the prospect is held for review instead of being messaged. This is one constant, `REQUIRE_CONTACT_BASIS`, in `outbound-send.js`; turning it off is your call.

The lower-risk alternative for 10-20 businesses a day is to send the same personalised message by hand from the WhatsApp Business app and use this sheet only for tracking. The reply handling below works either way for numbers on the Cloud API.

I am not giving legal advice. Keep a record of why each business was contacted, and honour every "stop" on every list (the flow does this for you).

## Sending rules (as built)

| Rule | Behaviour |
|---|---|
| Who | Only `Status = Outreach Ready`. Never Do Not Contact, Not Interested, Lost, or No Response. |
| How many | At most 3 per hourly run, 15 new prospects a day, 20 messages a day in total (follow-ups included, and they go first). Change `CAPS` in `outbound-send.js`. |
| When | Monday to Saturday, 10:00 to 18:00 IST. Anything due outside that is marked `Follow-up 1 Due` or `Follow-up 2 Due` and sent when the window opens. |
| Spacing | 70 to 140 seconds, random, between messages (a Wait node, so it costs no extra executions). |
| Personalised | Needs a Personalization Note of 15+ characters and a Business Name. Line breaks in the note are flattened (WhatsApp rejects them in template variables). |
| No claims | A note containing "guarantee", "100%", "#1", "double your" and similar is held for review. |
| Duplicates | The same phone in two campaigns is messaged once. A number that already said no is never messaged, whichever row it is in. |
| Held rows | A prospect that fails a check goes to `Human Review` with the reason in `Send Error`, once, so it is not retried every run. |

A failed send sets `Status = Human Review` and `Send Error = Send Failed: <reason>`, and emails `hello@turtleworks.in`. ("Send Failed" is not in your status list, so it lives in the `Send Error` column.)

## Reply handling (as built)

Checked in this order, so the safest reading always wins:

1. **NO** ("no", "stop", "not interested", "not relevant", "don't message me", "unsubscribe"): `Reply Status = NO`, `Status = Not Interested`, `Do Not Contact = Yes` on **every row with that phone**, sends "No problem. Thanks for replying. We won't follow up further." Nothing after this, ever.
2. **Price** ("price", "cost", "how much", "quote"): `Human Review`, Hot, sends your pricing line (no number), emails `projects@`.
3. **Call** ("call", "talk", "meeting"): `Call Requested`, Hot, asks for a time. Their next message is stored as `Preferred call time` and the team is emailed; the bot says nothing more.
4. **YES** ("yes", "interested", "send", "share", "ok", "okay", "sure"): `Reply Status = YES`, `Interested`, Hot, sends the 5-option question, emails `projects@` and `hello@`. Their answer (1-5) is stored as `Focus:` in Notes and the team is emailed.
5. **Anything else** (a question, "who is this?", a voice note or image): `Human Review`, no bot reply, team emailed. The bot never guesses.

Once a person owns the conversation (`Human Review`, `Call Requested`, `Interested` after the question), the bot sends nothing further, and every reply alerts the team.

**One deliberate change from your brief.** Follow-up 2 ends "Should I close this for now?". A reply of "yes" to that means *close it*, so treating it as YES would mark someone who wants out as a Hot lead. After follow-up 2, a bare "yes" or "ok" sets `Not Interested` and stops (reply: "Understood. Thanks for letting us know. You can message TurtleWorks anytime."). "yes, send it" or "interested" still counts as interest. If you would rather reword follow-up 2 so a plain YES means interest, change the last sentence and delete `close_yes` in `outbound-reply.js`.

## Setup

1. **Sheet.** In the same spreadsheet as the lead CRM, add tabs `Prospects` and `Outreach Log`. Paste `../prospects-sheet-columns.csv` and `../outreach-log-sheet-columns.csv` as row 1. Keep column names exactly. Leave the last seven columns (`Contact Basis` to `Last Message ID`) to the flow, except `Contact Basis`, which you fill in.
2. **Templates** (WhatsApp Manager, English, category Marketing). Variables are shown as `{{n}}`:
   - `tw_outreach_initial`: the message in your brief, with `{{1}}` name, `{{2}}` personalization note, `{{3}}` business name.
   - `tw_outreach_fu1`: "Hi {{1}}, just checking once. Would you like a quick sample direction for {{2}}'s website/enquiry flow?" then two lines "YES - send it" and "NO - not relevant".
   - `tw_outreach_fu2`: "Last follow-up from my side, {{1}}. If improving your website or enquiry flow becomes relevant later, you can message TurtleWorks anytime. Should I close this for now?"
3. **Placeholders.** Same as the lead hub, plus `__OUTBOUND_REPLY_WORKFLOW_ID__` (the id of TW-11, used inside TW-08). Import TW-11 first, then TW-08, then TW-10.
4. **Start small.** Add 5 prospects, fill `Contact Basis` and `Personalization Note`, set `Outreach Ready`, and run TW-10 once by hand to see the first message on your own phone. Only then add a batch.

Prospect columns you provide: Prospect ID, Name, Business Name, Phone (10-digit Indian mobiles get +91), Email, Niche, Location, Website URL, Instagram URL, Source of Prospect, Campaign Name, Personalization Note, Status, Priority, Owner, Notes, and `Contact Basis`. `Lead Type` is set to `Outbound` for you.

## Dashboard (Google Sheets or Looker Studio)

Everything below reads the `Prospects` tab. Put these on a `Dashboard` tab, or connect Looker Studio to `Prospects` and build the same fields.

| Metric | Formula |
|---|---|
| Total prospects | `=COUNTA(Prospects!A2:A)` |
| Outreach sent | `=COUNTIF(Prospects!AA2:AA,">0")` |
| YES replies | `=COUNTIF(Prospects!R2:R,"YES")` |
| NO replies | `=COUNTIF(Prospects!R2:R,"NO")` |
| No response | `=COUNTIF(Prospects!N2:N,"No Response")` |
| Follow-ups due | `=COUNTIF(Prospects!N2:N,"Follow-up 1 Due")+COUNTIF(Prospects!N2:N,"Follow-up 2 Due")` |
| Calls requested | `=COUNTIF(Prospects!N2:N,"Call Requested")` |
| Hot leads | `=COUNTIF(Prospects!S2:S,"Hot")` |
| Conversion rate | `=IFERROR(COUNTIF(Prospects!N2:N,"Won")/COUNTIF(Prospects!AA2:AA,">0"),0)` |
| Leads by niche | `=QUERY(Prospects!A1:AD,"select F, count(A) where A is not null group by F label count(A) 'Prospects'",1)` |
| Leads by campaign | `=QUERY(Prospects!A1:AD,"select K, count(A) where A is not null group by K label count(A) 'Prospects'",1)` |
| Next follow-up dates | `=QUERY(Prospects!A1:AD,"select A, C, Q where Q is not null and Q <> '' order by Q",1)` |

Column letters follow the header order in `prospects-sheet-columns.csv`. Set the spreadsheet time zone to Asia/Kolkata.

## Files

| File | Purpose |
|---|---|
| `outbound-send.js` | Who to message this run: caps, hours, checks, follow-up timing |
| `outbound-reply.js` | YES / NO / price / call handling |
| `tag-prospect-replies.js` | Runs inside TW-08: sends prospect replies to TW-11 instead of the lead flow |
| `test-outreach.mjs` | 101 checks. Run `node test-outreach.mjs` after any change |
| `build-outreach.mjs` | Regenerates `../tw-10-*.json`, `../tw-11-*.json` and the sheet header files |

## Limits

- The Meta webhook is protected only by its secret path (see the lead hub notes); signature checking is the next hardening step.
- If the `Prospects` tab does not exist, TW-08 skips the check and behaves exactly as before.
- TW-10 runs 8 times a day, six days a week, about 210 executions a month.
- WhatsApp only lets you send free text within 24 hours of the customer's last message. Every first message and follow-up here is a template; replies to a prospect who has just written back are free text.
