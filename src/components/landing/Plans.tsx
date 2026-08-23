"use client";

import { motion } from "motion/react";
import { useLocale as useRoutingLocale, useTranslations } from "next-intl";
import { Button } from "@/components/landing/Button";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { Check } from "@/components/landing/icons";
import { EASE, inViewLoose, stagger } from "@/components/landing/motion";
import { useContent, useLocale } from "@/components/landing/use-landing-content";
import { Money } from "@/components/ui/money";
import { planRhythm } from "@/lib/offer-facts";
import { useStore } from "@/mock/store";
import type { Locale } from "@/i18n/routing";

/**
 * The plans, three across, the middle one raised.
 *
 * **The big figure is the price, not a discount** — the one place this section
 * departs from the design, and deliberately. The design sets `−20%` at 96px,
 * which describes a discount scheme. This product is not one: a plan is a
 * number of visits bought in advance and usable for a term, and
 * `extraDiscountPercent` only ever applies to work *outside* the package. A
 * percentage in the largest type on the card would sell something the business
 * does not offer, and it would contradict /abos, which shows the real price.
 *
 * The term sits directly under the figure rather than in a footnote. This is a
 * year paid in one go, and a reader assumes monthly unless told otherwise in
 * the same breath.
 *
 * Everything else — the grid, the raised middle card, the ribbon, the stagger,
 * the hover — is the design's, unchanged. The cards also read the store rather
 * than a hardcoded array, so retiring a plan in the panel removes it from the
 * homepage instead of leaving it advertised.
 */
export function Plans() {
  const t = useContent();
  const { locale } = useLocale();
  const routingLocale = useRoutingLocale() as Locale;
  const p = useTranslations("site.plans");
  const rhythmT = useTranslations("admin.rhythm");
  const plans = useStore((s) => s.plans);

  const shown = plans
    .filter((plan) => plan.active && plan.visibleOnSite)
    .sort((a, b) => a.order - b.order);

  /* Nothing on sale — say nothing rather than render an empty rail. The office
     controls this with `visibleOnSite`, and a section that insists on existing
     would advertise a product nobody can buy. */
  if (shown.length === 0) return null;

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
            <Button href="/abos" variant="red" size="md">
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
          {shown.map((plan, index) => {
            /* The middle one, not the dearest one. A "recommended" badge on the
               top tier reads as a sales tactic to this audience, and picking by
               position is what lets the office add or retire a plan without the
               ribbon landing on nothing. */
            const featured = shown.length > 1 && index === Math.floor((shown.length - 1) / 2);

            return (
              <motion.article
                key={plan.id}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
                }}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 240, damping: 24 }}
                className={`hv-card relative p-8 sm:p-10 ${
                  featured
                    ? "hv-card-dark z-10 text-ink-inverse shadow-[0_40px_90px_-50px_rgba(11,27,63,0.85)] lg:py-14"
                    : "hv-card-light text-ink"
                }`}
              >
                {featured ? (
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
                    {p("recommended")}
                  </motion.span>
                ) : null}

                <h3 className="text-xl tracking-[0.02em]">{plan.name[routingLocale]}</h3>
                <p
                  className={`mt-4 text-base ${featured ? "text-ink-inverse/70" : "text-ink-secondary"}`}
                >
                  {rhythmT(planRhythm(plan))}
                </p>

                <p
                  data-numeric
                  className={`display-type mt-6 text-[clamp(44px,5.4vw,74px)] leading-[0.82] ${
                    featured ? "text-ink-inverse" : "text-ink"
                  }`}
                >
                  <Money amount={plan.price} />
                </p>

                <p
                  className={`mt-6 text-base ${featured ? "text-ink-inverse/70" : "text-ink-secondary"}`}
                >
                  {p("priceNote", { months: plan.validityMonths, visits: plan.includedVisits })}
                </p>

                <div className={`my-7 h-px w-full ${featured ? "bg-page/18" : "bg-line"}`} />

                <motion.ul
                  initial="hidden"
                  whileInView="show"
                  viewport={inViewLoose}
                  variants={stagger(0.08, 0.25)}
                  className="space-y-4"
                >
                  {plan.features.map((f, i) => (
                    <motion.li
                      key={i}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
                      }}
                      className="flex items-start gap-3"
                    >
                      <Check
                        className={`mt-1 h-4 w-4 shrink-0 ${
                          featured ? "text-ink-accent" : "text-ink"
                        }`}
                      />
                      <span className={`text-base ${featured ? "text-ink-inverse" : "text-ink"}`}>
                        {f[routingLocale] || f.de}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>

                <Button
                  href={`/anfrage?abo=${plan.id}`}
                  variant={featured ? "red" : "navy"}
                  className="mt-9 w-full"
                >
                  {t.actions.startPlan}
                </Button>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
