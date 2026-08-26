"use client";

import { DisplayLines } from "@/components/landing/DisplayLines";
import { Button } from "@/components/landing/Button";
import { Reveal } from "@/components/landing/Reveal";
import { headlineLines, spokenHeadline, type HeadlineLine } from "@/lib/display-headline";

/**
 * The section shell for interior pages.
 *
 * Same rhythm as the homepage — `py-20` / `76px`, the 1440 container, the
 * 48px gutter — because a page that changes its vertical rhythm halfway
 * through the site reads as a different site.
 */
export function PageSection({
  children,
  id,
  tone = "page",
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  tone?: "page" | "sunken";
  className?: string;
}) {
  return (
    <section
      id={id}
      /* `scroll-mt` on every section, not only the ones linked today: the
         header is fixed, and a jump link that lands the heading underneath it
         is the same bug wherever it appears. */
      className={`overflow-x-clip py-20 lg:py-[76px] ${id ? "scroll-mt-24" : ""} ${tone === "sunken" ? "bg-sunken" : ""} ${className}`}
    >
      <div className="hv-container">{children}</div>
    </section>
  );
}

/**
 * Display heading hard left, one red pill hard right.
 *
 * This row is the unit that makes a page scan as this direction — five
 * sections of the homepage use it, so every interior page reaches for it
 * first. It is a component rather than a pattern people re-type because the
 * alignment (`items-center`, not `items-end`) and the wrap behaviour are easy
 * to get subtly wrong, and one section out of step is visible immediately.
 *
 * Interior headings sit at the restrained scale, not the homepage's 82px: a
 * page that is mostly a table or a list should not open every block at poster
 * size. Still never below 36px — Bebas is caps-only and condensed, and under
 * that it stops being a voice and becomes a reading problem.
 */
export function SectionHead({
  lines,
  lead,
  action,
  className = "",
}: {
  lines: unknown;
  lead?: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  const parsed: HeadlineLine[] = headlineLines(lines);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-8 ${className}`}>
      <div className="max-w-[46ch]">
        <h2 className="display-type text-display-4 leading-[0.95]">
          <span className="sr-only">{spokenHeadline(parsed)}</span>
          <DisplayLines ariaHidden className="block">
            {parsed.map((line, i) => (
              <span key={i} className="block">
                {line.lead ? <span className="text-ink">{line.lead}</span> : null}
                {line.lead && line.accent ? " " : null}
                {line.accent ? <span className="text-ink-accent">{line.accent}</span> : null}
              </span>
            ))}
          </DisplayLines>
        </h2>
        {lead ? (
          <Reveal delay={0.12}>
            <p className="text-ink-secondary mt-5 text-lead leading-[1.55]">{lead}</p>
          </Reveal>
        ) : null}
      </div>

      {action ? (
        <Reveal delay={0.15}>
          <Button href={action.href} variant="red" size="md">
            {action.label}
          </Button>
        </Reveal>
      ) : null}
    </div>
  );
}
