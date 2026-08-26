"use client";

import { motion } from "motion/react";
import { Button } from "@/components/landing/Button";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { cardRise, inViewLoose, stagger } from "@/components/landing/motion";
import { useContent, useLocale } from "@/components/landing/use-landing-content";

export function Promises() {
  const t = useContent();
  const { locale } = useLocale();

  return (
    <section id="about" className="scroll-mt-28 py-16 lg:py-[74px]">
      <div className="hv-container">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <h2 className="display-type text-display-3 leading-[0.95]">
            <DisplayLines key={locale}>
              {[
                <span key="a">
                  <span className="text-ink">{t.promises.headline.navy}</span>
                  <span className="text-ink-accent">{t.promises.headline.red}</span>
                </span>,
              ]}
            </DisplayLines>
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inViewLoose}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <Button href="/ueber-uns" variant="red" size="md">
              {t.actions.about}
            </Button>
          </motion.div>
        </div>

        <motion.ul
          key={locale}
          initial="hidden"
          whileInView="show"
          viewport={inViewLoose}
          variants={stagger(0.09)}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {t.promises.items.map((item) => (
            <motion.li
              key={item.title}
              variants={cardRise}
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className={`hv-card group overflow-hidden p-6 ${
                item.featured ? "hv-card-dark text-ink-inverse" : "hv-card-light text-ink"
              }`}
            >
              <h3 className="text-xl leading-snug font-medium">{item.title}</h3>
              <p
                className={`mt-4 text-body leading-[1.62] transition-colors duration-400 ${
                  item.featured
                    ? "text-ink-inverse/70 group-hover:text-ink-inverse/90"
                    : "text-ink-secondary group-hover:text-ink"
                }`}
              >
                {item.body}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
