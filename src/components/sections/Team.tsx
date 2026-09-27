import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ArrowUpRight } from "@/components/ui/Icons";
import { Reveal } from "@/components/motion/Reveal";
import { team } from "@/data/team";

/** Renders only when real team members are listed in src/data/team.ts. */
export function Team() {
  if (!team.length) return null;

  return (
    <section
      id="team"
      aria-labelledby="team-title"
      className="section-solid relative py-28 md:py-36"
    >
      <Container>
        <Reveal>
          <Eyebrow>The people</Eyebrow>
          <h2 id="team-title" className="mt-5 max-w-2xl text-h2">
            Who you&rsquo;ll actually work with.
          </h2>
        </Reveal>

        <ul className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((person, i) => (
            <Reveal as="li" key={person.name} delay={i * 80}>
              {person.photo ? (
                <Image
                  src={person.photo}
                  alt={`Portrait of ${person.name}`}
                  width={480}
                  height={560}
                  className="aspect-[6/7] w-full rounded-2xl object-cover"
                />
              ) : null}
              <h3 className="mt-6 font-display text-2xl text-ivory">{person.name}</h3>
              <p className="mt-1 text-sm text-mint">{person.role}</p>
              <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-ivory-soft">
                {person.bio}
              </p>
              {person.linkedin ? (
                <a
                  href={person.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-ivory underline-offset-4 hover:underline"
                >
                  LinkedIn <ArrowUpRight size={14} />
                  <span className="sr-only"> profile of {person.name} (opens in a new tab)</span>
                </a>
              ) : null}
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
