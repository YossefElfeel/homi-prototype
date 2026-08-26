"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Button } from "@/components/landing/Button";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { EASE } from "@/components/landing/motion";
import { headlineLines, spokenHeadline, type HeadlineLine } from "@/lib/display-headline";

export type MastheadStat = { label: string; value: string };

/**
 * The page opening for every route that is not the homepage.
 *
 * **It is almost always type only.** The full-bleed hero belongs to the
 * homepage and it is the loudest thing on the site; nine other pages each
 * opening on their own photograph would leave the homepage competing with the
 * rest of the site instead of leading it. Interior pages get the same navy
 * card at the same radius, inset the same way, and words in it.
 *
 * **It hugs its content.** An earlier version fixed the height, which on a
 * page with a short heading left a 1443×494 slab whose widest element was 768
 * — half a card of bare navy with nothing to balance it, reading as an
 * unfinished hero rather than a quiet one. There is no height here now: a page
 * with two lines and a button gets a short band, which is the honest shape for
 * a signpost.
 *
 * **`stats` is how a page fills the other half.** Two or three facts, read
 * from real data, sitting bottom-right — the interior echo of the hero's
 * floating badge: same role, same corner, no photograph. Pages with no fact
 * worth printing pass none and stay a band; an invented figure to fill space
 * would be worse than the space.
 */
export function Masthead({
  lines,
  lead,
  action,
  stats,
  image,
  children,
}: {
  /** Raw value from a message file — validated here, see lib/display-headline. */
  lines: unknown;
  lead?: string;
  action?: { label: string; href: string };
  stats?: MastheadStat[];
  /**
   * The one exception to the no-photograph rule, and only where a page is
   * *about* one thing there is a picture of — a single service. It sits at
   * 40% on the right rather than full-bleed, so it reads as a smaller sibling
   * of the hero instead of a second one.
   */
  image?: { src: string; alt: string };
  /** Anything that belongs inside the card below the action — a form, a filter. */
  children?: React.ReactNode;
}) {
  const parsed: HeadlineLine[] = headlineLines(lines);
  const hasFacts = Boolean(stats && stats.length > 0);

  return (
    <section className="px-3 pt-3 sm:px-7 sm:pt-7">
      <motion.div
        initial={{ opacity: 0, scale: 0.985, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="bg-inverse text-ink-inverse relative overflow-hidden rounded-[var(--radius-xl)] px-6 py-14 sm:px-10 sm:py-16 lg:px-15 lg:py-20"
      >
        {image ? (
          <>
            {/* Clipped by the card's own radius, and scrimmed on its left edge
                so the headline never has to compete with whatever the
                photograph happens to be bright at. */}
            <div className="absolute inset-y-0 right-0 hidden w-2/5 lg:block">
              <Image src={image.src} alt={image.alt} fill sizes="40vw" className="object-cover" />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, var(--surface-inverse) 0%, rgb(11 27 63 / 0.45) 45%, rgb(11 27 63 / 0.1) 100%)',
                }}
              />
            </div>
          </>
        ) : null}

        {/* The facts sit beside the words, not under them: a row below would
            push the card taller again and leave the same void to its right. */}
        <div
          className={`relative gap-12 ${
            hasFacts ? "lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" : ""
          }`}
        >
          <div className={image ? "lg:max-w-[58%]" : undefined}>
            <h1 className="display-type text-display-2 leading-[0.92] text-balance">
              {/* Read as one sentence; the masks and the colour split are
                  presentation, and four announced fragments lose the sentence. */}
              <span className="sr-only">{spokenHeadline(parsed)}</span>
              <DisplayLines ariaHidden immediate delay={0.15} className="block">
                {parsed.map((line, i) => (
                  <span key={i} className="block">
                    {line.lead ? <span>{line.lead}</span> : null}
                    {line.lead && line.accent ? " " : null}
                    {line.accent ? (
                      <span className="text-ink-accent-inverse">{line.accent}</span>
                    ) : null}
                  </span>
                ))}
              </DisplayLines>
            </h1>

            {lead ? (
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
                className="text-ink-inverse/75 mt-7 max-w-[62ch] text-lead leading-[1.55] sm:text-lg"
              >
                {lead}
              </motion.p>
            ) : null}

            {action ? (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.72 }}
                className="mt-9"
              >
                {/* The masthead card is navy — a red button washing navy
                    here would erase itself on hover. */}
                <Button href={action.href} variant="red" surface="inverse">
                  {action.label}
                </Button>
              </motion.div>
            ) : null}

            {children ? (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.72 }}
                className="mt-9"
              >
                {children}
              </motion.div>
            ) : null}
          </div>

          {hasFacts ? (
            <motion.dl
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.84 }}
              className="mt-12 flex flex-col gap-7 border-t border-page/12 pt-8 sm:flex-row sm:gap-12 lg:mt-0 lg:w-[19rem] lg:flex-col lg:gap-7 lg:border-t-0 lg:border-l lg:border-page/12 lg:pt-0 lg:pl-12"
            >
              {stats!.map((stat) => (
                <div key={stat.label}>
                  {/* Figure first, label under it — the same order as the
                      homepage stats band. A label above the number is the
                      wave-1 pattern this pass is retiring. */}
                  <dd
                    data-numeric
                    className="display-type text-figure-4 leading-[0.85]"
                  >
                    {stat.value}
                  </dd>
                  <dt className="text-ink-inverse/60 mt-2 max-w-[15rem] text-body leading-[1.4]">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </motion.dl>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
