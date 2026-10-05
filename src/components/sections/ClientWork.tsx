import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight } from "@/components/ui/Icons";
import { Reveal } from "@/components/motion/Reveal";
import { clients, type ClientCase } from "@/data/clients";

/*
  Selected client work: real, live sites a visitor can open. Each screenshot
  sits in a consistent browser frame so two very different sites read as one
  set, and the whole frame links out. The thumbnail reuses the service-tile
  hover (lift + light sweep). Cards are editorial, not boxed: only the CTA is
  pinned to the bottom so both cards close on the same line. Reviews render
  only when a client has approved the wording.
*/

function ClientCard({ client }: { client: ClientCase }) {
  return (
    <article className="svc-tile flex h-full flex-col">
      <a
        href={client.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open the ${client.name} website in a new tab`}
        className="group/scene block"
      >
        <figure className="svc-scene relative overflow-hidden rounded-2xl bg-[rgba(8,19,15,0.55)] ring-1 ring-[rgba(220,235,228,0.12)]">
          <div className="flex items-center gap-3 px-4 py-3">
            <span aria-hidden className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[rgba(220,235,228,0.24)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[rgba(220,235,228,0.24)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[rgba(220,235,228,0.24)]" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-[rgba(5,9,8,0.4)] px-2.5 py-1">
              <span className="truncate text-xs text-ivory-muted">{client.host}</span>
              <ArrowUpRight
                size={13}
                className="ml-auto shrink-0 text-ivory-muted transition-transform duration-300 group-hover/scene:translate-x-0.5"
              />
            </span>
          </div>
          <span className="block aspect-[16/10] border-t border-[rgba(220,235,228,0.08)] bg-ivory">
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
        </figure>
      </a>

      <h3 className="mt-7 text-h3">{client.name}</h3>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-gold">
        {client.kind}
      </p>
      <p className="mt-4 leading-relaxed text-ivory-soft">{client.summary}</p>

      <ul className="mt-6 space-y-2.5">
        {client.built.map((fact) => (
          <li key={fact} className="flex gap-3 leading-relaxed text-ivory-soft">
            <span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
            {fact}
          </li>
        ))}
      </ul>

      {client.review ? (
        <blockquote className="mt-7">
          <p className="leading-relaxed text-ivory">
            <span aria-hidden className="mr-0.5 font-display text-gold">&ldquo;</span>
            {client.review.quote}
            <span aria-hidden className="ml-0.5 font-display text-gold">&rdquo;</span>
          </p>
          <cite className="mt-2 block text-sm not-italic text-ivory-muted">
            {client.review.author}
          </cite>
        </blockquote>
      ) : null}

      <a
        href={client.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group/visit mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-8 font-medium text-ivory underline decoration-[color-mix(in_srgb,var(--color-amber)_70%,transparent)] underline-offset-4"
      >
        Visit {client.host}
        <ArrowUpRight className="transition-transform duration-300 group-hover/visit:translate-x-0.5 group-hover/visit:-translate-y-0.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
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
            Real work you can open right now. Each one started with a single problem and only
            what it took to solve it.
          </p>
        </Reveal>

        <Reveal className="mt-14 grid items-stretch gap-x-12 gap-y-16 md:mt-16 md:grid-cols-2">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </Reveal>

        <Reveal className="mt-16 flex flex-col gap-5 border-t border-[rgba(220,235,228,0.1)] pt-10 md:mt-20 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl text-lg text-ivory-soft">
            Every project runs the same way: map the problem, build only what it needs, hand it
            over working. That keeps it quick and keeps the cost honest.
          </p>
          <Button href="#contact" variant="primary" className="self-start md:self-auto">
            Start with your problem
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
