"use client";

import { motion } from "motion/react";
import { Button } from "@/components/landing/Button";
import { Counter } from "@/components/landing/Counter";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { Check } from "@/components/landing/icons";
import { EASE, inViewLoose, stagger } from "@/components/landing/motion";
import { useContent, useLocale } from "@/components/landing/use-landing-content";

export function Plans() {
  const t = useContent();
  const { locale } = useLocale();

  return (
    <section id="plans" className="scroll-mt-28 py-20 lg:py-[76px]">
      <div className="hv-container">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <h2 className="display-type text-[clamp(36px,5.7vw,82px)] leading-[0.95]">
            <DisplayLines key={locale}>
              {[
                <span key="a">
                  <span className="text-ink">{t.plans.headline.navy}</span>
                  <span className="text-ink-accent">{t.plans.headline.red}</span>
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
            <Button href="/preise" variant="red" size="md">
              {t.actions.comparePlans}
            </Button>
          </motion.div>
        </div>

        <motion.div
          id="pricing"
          key={locale}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          variants={stagger(0.12)}
          className="mt-16 grid scroll-mt-28 items-center gap-y-10 lg:grid-cols-[minmax(0,423fr)_minmax(0,466fr)_minmax(0,423fr)] lg:gap-4"
        >
          {t.plans.items.map((plan) => (
            <motion.article
              key={plan.name}
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
              }}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 240, damping: 24 }}
              className={`hv-card p-8 sm:p-10 ${
                plan.featured
                  ? "hv-card-dark z-10 text-ink-inverse shadow-[0_40px_90px_-50px_rgba(11,27,63,0.85)] lg:py-14"
                  : "hv-card-light text-ink"
              }`}
            >
              {plan.ribbon ? (
                <motion.span
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={inViewLoose}
                  transition={{
                    delay: 0.35,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="bg-accent absolute -top-5 left-1/2 -translate-x-1/2 rounded-full px-6 py-2.5 text-[15px] font-medium whitespace-nowrap text-ink-inverse"
                >
                  {plan.ribbon}
                </motion.span>
              ) : null}

              <h3 className="text-xl tracking-[0.02em]">{plan.name}</h3>
              <p className={`mt-4 text-base ${plan.featured ? "text-ink-inverse/70" : "text-ink-secondary"}`}>
                {plan.cadence}
              </p>

              <p
                className={`display-type mt-6 text-[clamp(62px,7vw,96px)] leading-[0.82] ${
                  plan.featured ? "text-ink-inverse" : "text-ink"
                }`}
              >
                −<Counter to={plan.discount} />%
              </p>

              <p className={`mt-6 text-base ${plan.featured ? "text-ink-inverse/70" : "text-ink-secondary"}`}>
                {t.plans.discountLabel}
              </p>

              <div className={`my-7 h-px w-full ${plan.featured ? "bg-page/18" : "bg-line"}`} />

              <motion.ul
                initial="hidden"
                whileInView="show"
                viewport={inViewLoose}
                variants={stagger(0.08, 0.25)}
                className="space-y-4"
              >
                {plan.features.map((f) => (
                  <motion.li
                    key={f}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
                    }}
                    className="flex items-start gap-3"
                  >
                    <Check
                      className={`mt-1 h-4 w-4 shrink-0 ${
                        plan.featured ? "text-ink-accent" : "text-ink"
                      }`}
                    />
                    <span className={`text-base ${plan.featured ? "text-ink-inverse" : "text-ink"}`}>
                      {f}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>

              <Button
                href="/anfrage"
                variant={plan.featured ? "red" : "navy"}
                className="mt-9 w-full"
              >
                {t.actions.startPlan}
              </Button>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
