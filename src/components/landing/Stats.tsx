"use client";

import { motion } from "motion/react";
import { Counter } from "@/components/landing/Counter";
import { EASE, inViewLoose, stagger } from "@/components/landing/motion";
import { useContent, useLocale } from "@/components/landing/use-landing-content";

/**
 * Splits a stat like "24 STD." or "CHF 49." into the number that should count
 * up and the text either side of it, so both languages animate the same way.
 */
function splitValue(value: string) {
  const m = value.match(/^(\D*)(\d+)(.*)$/);
  if (!m) return { prefix: value, n: null as number | null, suffix: "" };
  return { prefix: m[1], n: Number(m[2]), suffix: m[3] };
}

export function Stats() {
  const t = useContent();
  const { locale } = useLocale();

  return (
    <section className="bg-sunken">
      <motion.div
        key={locale}
        initial="hidden"
        whileInView="show"
        viewport={inViewLoose}
        variants={stagger(0.11)}
        className="hv-container grid grid-cols-1 gap-x-[52px] gap-y-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-12 lg:py-16"
      >
        {t.stats.map((row, i) => {
          const { prefix, n, suffix } = splitValue(row.value);
          const isPrice = row.value.startsWith("CHF");
          return (
            <motion.div
              key={row.label}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
              }}
            >
              <p
                className={`display-type text-[clamp(54px,5.6vw,86px)] leading-[0.8] ${
                  i === 0 ? "text-ink-accent" : "text-ink"
                }`}
              >
                {prefix ? <>{prefix.replace(/ /g, " ")}</> : null}
                {n !== null ? <Counter to={n} /> : null}
                {suffix ? (
                  <span className={isPrice ? "" : undefined}>
                    {suffix.replace(/ /g, " ")}
                  </span>
                ) : null}
                {isPrice ? <span className="text-ink-accent">–</span> : null}
              </p>
              <p className="text-ink-secondary mt-5 max-w-[280px] text-base leading-[1.55]">
                {row.label}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
