"use client";

import { motion } from "motion/react";
import { Button } from "@/components/landing/Button";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { Reveal } from "@/components/landing/Reveal";
import { EASE, inViewLoose, stagger } from "@/components/landing/motion";
import { useContent, useLocale } from "@/components/landing/use-landing-content";

export function Coverage() {
  const t = useContent();
  const { locale } = useLocale();

  return (
    <section className="py-20 lg:py-[70px]">
      <div className="hv-container grid gap-14 lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h2 className="display-type text-[clamp(36px,5.7vw,82px)] leading-[0.95]">
            <DisplayLines key={locale}>
              {[
                <span key="a" className="text-ink-accent">
                  {t.coverage.headline.red}
                </span>,
                <span key="b" className="text-ink">
                  {t.coverage.headline.navy}
                </span>,
              ]}
            </DisplayLines>
          </h2>

          <Reveal delay={0.12}>
            <p className="text-ink-secondary mt-6 max-w-[520px] text-[17px] leading-[1.55] sm:text-lg">
              {t.coverage.body}
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-8">
              <Button href="/anfrage" variant="red" size="md">
                {t.actions.quote}
              </Button>
            </div>
          </Reveal>
        </div>

        <motion.ul
          key={locale}
          initial="hidden"
          whileInView="show"
          viewport={inViewLoose}
          variants={stagger(0.06)}
          className="grid grid-cols-2 gap-4 sm:grid-cols-6"
        >
          {t.coverage.items.map((m, i) => (
            <motion.li
              key={m.name}
              variants={{
                hidden: { opacity: 0, y: 22, scale: 0.97 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.62, ease: EASE },
                },
              }}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className={`hv-card hv-card-light group overflow-hidden px-6 py-6 ${
                // Three, three, then two wider tiles — the design's 3-3-2 grid.
                i >= 6 ? "sm:col-span-3" : "sm:col-span-2"
              }`}
            >
              <p className="text-ink text-[17px] leading-none font-medium">{m.name}</p>
              <p className="text-ink-secondary group-hover:text-ink mt-3 text-sm tabular-nums transition-colors duration-400">
                {m.zip}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
