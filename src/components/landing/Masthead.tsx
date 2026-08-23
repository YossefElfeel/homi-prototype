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
 * **Why it has no photograph.** The full-bleed hero is the homepage's, and it
 * is the loudest thing on the site. Nine other pages each opening on their own
 * photograph would leave the homepage competing with the rest of the site
 * instead of leading it. So interior pages get the same navy card at the same
 * radius, inset the same way — and nothing in it but type.
 *
 * It is also shorter: the hero fills the viewport because it is the argument,
 * and these are signposts. Around 40vh, floored so a long German heading still
 * has room.
 *
 * The optional stat strip is for pages that open on facts rather than on a
 * claim — the region pages, where the postcode and the response window are the
 * reason someone arrived.
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

  return (
    <section className="px-3 pt-3 sm:px-7 sm:pt-7">
      <motion.div
        initial={{ opacity: 0, scale: 0.985, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="bg-inverse text-ink-inverse relative overflow-hidden rounded-[var(--radius-xl)] px-6 py-16 sm:px-10 sm:py-20 lg:px-15 lg:py-24"
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

        <h1 className="display-type relative text-[clamp(38px,6vw,88px)] leading-[0.92] lg:max-w-[58%]">
          {/* Read as one sentence; the masks and the colour split are
              presentation, and four announced fragments lose the sentence. */}
          <span className="sr-only">{spokenHeadline(parsed)}</span>
          <DisplayLines ariaHidden immediate delay={0.15} className="block">
            {parsed.map((line, i) => (
              <span key={i} className="block">
                {line.lead ? <span>{line.lead}</span> : null}
                {line.lead && line.accent ? " " : null}
                {line.accent ? <span className="text-ink-accent">{line.accent}</span> : null}
              </span>
            ))}
          </DisplayLines>
        </h1>

        {lead ? (
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
            className="text-ink-inverse/75 relative mt-7 max-w-[62ch] text-[17px] leading-[1.55] sm:text-lg lg:max-w-[52%]"
          >
            {lead}
          </motion.p>
        ) : null}

        {action ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.72 }}
            className="relative mt-9"
          >
            <Button href={action.href} variant="red">
              {action.label}
            </Button>
          </motion.div>
        ) : null}

        {children ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.72 }}
            className="relative mt-9"
          >
            {children}
          </motion.div>
        ) : null}

        {stats && stats.length > 0 ? (
          <motion.dl
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.84 }}
            className="relative mt-12 grid gap-8 border-t border-page/12 pt-8 sm:grid-cols-3"
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-ink-inverse/60 text-[15px]">{stat.label}</dt>
                <dd
                  data-numeric
                  className="display-type mt-2 text-[clamp(36px,3.6vw,52px)] leading-[0.9]"
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        ) : null}
      </motion.div>
    </section>
  );
}
