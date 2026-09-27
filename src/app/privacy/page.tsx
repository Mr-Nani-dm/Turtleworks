import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { site } from "@/data/site";

/*
  Plain-language notice that describes what this site actually does.
  Have it reviewed for your jurisdiction (e.g. UK/EU GDPR, India DPDP Act)
  before relying on it, and add your registered business details.
*/

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How TurtleWorks handles personal information sent through this website.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "27 September 2026";
const analyticsOn = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "1";

export default function PrivacyPage() {
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
      <h2>What we collect</h2>
      <p>When you send an enquiry through this site, we receive:</p>
      <ul>
        <li>your name and email address,</li>
        <li>your company name, if you choose to give it,</li>
        <li>the message you write.</li>
      </ul>
      <p>
        Like any website, our hosting provider processes technical information
        such as your IP address and browser type to deliver pages and protect the
        site from abuse.
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

      <h2>Why we use it</h2>
      <p>
        Only to read and reply to your enquiry, and to discuss potential work if
        you want to. We don&rsquo;t add you to mailing lists.
      </p>

      <h2>Who else handles it</h2>
      <p>
        Service providers that run this website and route enquiries to us — our
        website host and the email or automation service that delivers your
        message. They process it on our behalf and for no other purpose.
      </p>

      <h2>How long we keep it</h2>
      <p>
        As long as needed to handle your enquiry and any work that follows from
        it. If nothing follows, we delete it.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask us to show you, correct or delete the information you sent.{" "}
        {site.email ? (
          <>
            Write to <a href={`mailto:${site.email}`}>{site.email}</a>.
          </>
        ) : (
          <>
            Send your request through the <Link href="/#contact">enquiry form</Link>.
          </>
        )}
      </p>

      <h2>Changes</h2>
      <p>
        If this notice changes, we&rsquo;ll update it here and change the date at
        the top.
      </p>
    </PageShell>
  );
}
