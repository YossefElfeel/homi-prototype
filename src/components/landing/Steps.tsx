"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/landing/Button";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { cardRise, inViewLoose, stagger } from "@/components/landing/motion";
import { useContent, useLocale } from "@/components/landing/use-landing-content";

export function Steps() {
  const t = useContent();
  const { locale } = useLocale();
  // One highlight for the whole row: the navy panel slides to whichever card
  // the pointer is on, and returns to step one on the way out. The cards
  // themselves stay put — a lift as well would be two motions fighting.
  const [active, setActive] = useState(0);

  return (
    <section id="work" className="scroll-mt-28 py-20 lg:py-[80px]">
      <div className="hv-container">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <h2 className="display-type text-display-3 leading-[0.95]">
            <DisplayLines key={locale}>
              {[
                <span key="a">
                  <span className="text-ink">{t.steps.headline.navy}</span>
                  <span className="text-ink-accent">{t.steps.headline.red}</span>
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
            <Button href="/anfrage" variant="red" size="md">
              {t.actions.quote}
            </Button>
          </motion.div>
        </div>

        <motion.ol
          key={locale}
          initial="hidden"
          whileInView="show"
          viewport={inViewLoose}
          variants={stagger(0.09)}
          onMouseLeave={() => setActive(0)}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {t.steps.items.map((step, i) => {
            const on = active === i;
            return (
              <motion.li
                key={step.n}
                variants={cardRise}
                onMouseEnter={() => setActive(i)}
                onFocusCapture={() => setActive(i)}
                className="bg-sunken relative isolate cursor-default rounded-3xl"
              >
                {/* Sits on its own layer, unclipped, so the highlight travels
                    across the gap between cards instead of vanishing at the
                    edge of the one it is leaving. */}
                {on ? (
                  <motion.span
                    aria-hidden
                    layoutId="step-panel"
                    transition={{ type: "spring", stiffness: 340, damping: 34 }}
                    className="bg-inverse absolute inset-0 -z-10 rounded-3xl shadow-[0_18px_44px_-24px_rgba(11,27,63,0.55)]"
                  />
                ) : null}

                <div className="flex items-start gap-4 p-6">
                  <span
                    aria-hidden
                    className={`display-type shrink-0 text-[100px] leading-[0.72] transition-colors duration-400 ${
                      on ? "text-ink-inverse" : "text-ink"
                    }`}
                  >
                    {step.n}
                  </span>
                  <div className="pt-1.5">
                    <h3
                      className={`text-xl leading-tight font-medium transition-colors duration-400 ${
                        on ? "text-ink-inverse" : "text-ink"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`mt-2 text-body leading-[1.5] transition-colors duration-400 ${
                        on ? "text-ink-inverse/72" : "text-ink-secondary"
                      }`}
                    >
                      {step.body}
                    </p>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}
