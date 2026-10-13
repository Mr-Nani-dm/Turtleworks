import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { clients, type ClientCase } from "@/data/clients";

/*
  Selected client work, kept minimal: a small cropped screenshot that links
  to the live site, then the name and a two-line brief. The screenshot is
  cropped from the top (object-top) so the site's own trailing whitespace
  never shows. Reuses the service-tile hover (lift + light sweep).
*/

function ClientCard({ client }: { client: ClientCase }) {
  return (
    <article className="svc-tile flex flex-col">
      <a
        href={client.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open the ${client.name} website in a new tab`}
        className="svc-scene block overflow-hidden ring-1 ring-[rgba(220,235,228,0.12)]"
      >
        <span className="block aspect-[3/1] bg-ivory">
          <Image
            src={client.image}
            alt={`The ${client.name} website`}
            width={800}
            height={500}
            sizes="(min-width: 768px) 44vw, 90vw"
            className="h-full w-full object-cover object-top"
          />
        </span>
        <span className="svc-sheen" aria-hidden="true" />
      </a>

      <h3 className="mt-5 font-display text-xl font-semibold leading-snug text-ivory">
        {client.name}
      </h3>
      <p className="mt-2 leading-relaxed text-ivory-soft">{client.summary}</p>
    </article>
  );
}

export function ClientWork() {
  return (
    <section id="clients" aria-labelledby="clients-title" className="section-solid relative py-24 md:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <h2 id="clients-title" className="text-h2">
            We&rsquo;ve built it for clients,
            <br />
            <span className="text-mint">not just ourselves.</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ivory-soft">
            Real work you can open right now &mdash; tap a site to visit it.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-x-12 gap-y-12 md:mt-14 md:grid-cols-2">
          {clients.map((client) => (
            <Reveal key={client.id}>
              <ClientCard client={client} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
