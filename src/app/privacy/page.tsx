import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import { getDeliveryMode } from "@/lib/contact-delivery";

/*
  Plain-language notice describing what this site actually does. Before relying
  on it: set NEXT_PUBLIC_LEGAL_NAME / NEXT_PUBLIC_LOCATION (and ideally a postal
  address), and have it reviewed for your jurisdiction (e.g. UK/EU GDPR,
  India DPDP Act).
*/

export const metadata: Metadata = pageMetadata({
  path: "/privacy",
  title: "Privacy notice",
  description: "How TurtleWorks handles personal information sent through this website.",
});

const UPDATED = "27 September 2026";
const analyticsOn = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "1";

export default function PrivacyPage() {
  const delivery = getDeliveryMode();
  const controller = site.legalName ?? site.name;

  const contactRoute = site.email ? (
    <>
      write to <a href={`mailto:${site.email}`}>{site.email}</a>
    </>
  ) : delivery ? (
    <>
      use the <Link href="/#contact">enquiry form</Link>
    </>
  ) : null;

  return (
    <PageShell
      title="Privacy notice"
      updated={UPDATED}
      intro={
        <p>
          We collect as little as we can, use it only to reply to you, and
          never sell it. This page explains exactly what that means.
        </p>
      }
    >
      <h2>Who is responsible</h2>
      <p>
        {controller}
        {site.location ? `, based in ${site.location},` : ""} is responsible
        for the personal information described here.
        {contactRoute ? <> For any privacy question or request, {contactRoute}.</> : null}
      </p>

      <h2>What we collect</h2>
      <p>When you send an enquiry through this site, we receive:</p>
      <ul>
        <li>your name and email address,</li>
        <li>your company name, if you choose to give it,</li>
        <li>the message you write,</li>
        <li>the time you sent it and the page you sent it from.</li>
      </ul>
      <p>
        Like any website, our hosting provider processes technical information
        such as your IP address and browser type to deliver pages and protect the
        site. We also hold your IP address in memory for a few minutes to limit
        repeated submissions; it isn&rsquo;t stored with your enquiry.
      </p>

      <h2>What we don&rsquo;t collect</h2>
      <p>
        We don&rsquo;t use advertising or tracking cookies.
        {analyticsOn
          ? " We use privacy-friendly, cookie-free analytics that count visits in aggregate and do not identify you."
          : " We don't run analytics that identify you."}{" "}
        This site stores one setting in your own browser — whether you paused the
        background video — so it can remember your choice. That setting never
        leaves your device.
      </p>

      <h2>Why we use it, and on what basis</h2>
      <p>
        Only to read and reply to your enquiry and, if you want to, to discuss
        potential work. That is either a step you&rsquo;ve asked us to take before
        entering into an agreement, or our legitimate interest in responding to
        people who contact us. We don&rsquo;t add you to mailing lists.
      </p>

      <h2>Who else handles it</h2>
      <p>
        Service providers that run this website and route enquiries to us, acting
        on our behalf and for no other purpose: Vercel, which hosts the site
        {delivery === "resend"
          ? ", and Resend, which delivers enquiries to our inbox by email"
          : delivery === "webhook"
            ? ", and the automation service that delivers enquiries to us"
            : ""}
        . These providers may process data outside your country, under
        safeguards such as standard contractual clauses.
      </p>

      <h2>How long we keep it</h2>
      <p>
        As long as needed to handle your enquiry and any work that follows from
        it. You can ask us to delete it at any time.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us to access, correct or delete the information you sent, to
        restrict or object to how we use it, or to give you a copy in a portable
        form
        {contactRoute ? <> — just {contactRoute}</> : null}. You also have the
        right to complain to your local data-protection authority.
      </p>

      <h2>Changes</h2>
      <p>
        If this notice changes, we&rsquo;ll update it here and change the date at
        the top.
      </p>
    </PageShell>
  );
}
