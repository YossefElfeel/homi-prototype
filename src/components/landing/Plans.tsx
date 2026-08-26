"use client";

import { motion } from "motion/react";
import { useLocale as useRoutingLocale, useTranslations } from "next-intl";
import { Button } from "@/components/landing/Button";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { Check } from "@/components/landing/icons";
import { EASE, inViewLoose, stagger } from "@/components/landing/motion";
import { Counter } from "@/components/landing/Counter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContent, useLocale } from "@/components/landing/use-landing-content";
import { Money, formatChf } from "@/components/ui/money";
import { planRhythm } from "@/lib/offer-facts";
import { planSaving, plansByService, recommendedPlan } from "@/lib/plan-facts";
import { useStore } from "@/mock/store";
import type { Plan } from "@/mock/schema";
import type { Locale } from "@/i18n/routing";

/**
 * The plans, three across, the middle one raised.
 *
 * **The big figure is the price you pay, and above it is the price you would
 * have paid.** The card used to show the package price alone, which made the
 * best argument for a plan invisible: CHF 3'440 says nothing until you know
 * the same twenty-six visits cost CHF 3'822 bought one at a time. The saving
 * was always real — it is baked into every plan price in the seed — it simply
 * was not on the card.
 *
 * The design put `−20%` in the largest type on the card. That is still not
 * what this section does, and for the same reason as before: the number a
 * buyer is committing to is the number, and a percentage in 74px sells the
 * discount rather than the product. The percentage is a badge; the franc
 * figure is the headline. `listPrice` is the plan's own field, so a card can
 * only claim a saving the office actually entered — and `planSaving` returns
 * nothing when it was not, rather than inventing a "before".
 *
 * The figure counts up the first time it scrolls into view. The markup carries
 * the final number, so it is right without a single frame of animation — see
 * `Counter` for why that is not negotiable.
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
export function Plans({
  /**
   * One rail per service, each under the service's name. Off on the homepage —
   * that block is an invitation to the plans page, and a page-worth of
   * structure inside it would answer a question the visitor has not asked yet.
   * On /abos it is the page.
   */
  byService = false,
}: {
  byService?: boolean;
}) {
  const t = useContent();
  const { locale } = useLocale();
  const p = useTranslations("site.plans");
  const routingLocale = useRoutingLocale() as Locale;
  const plans = useStore((s) => s.plans);
  const services = useStore((s) => s.services);

  const groups = plansByService(plans, services);

  /* Nothing on sale — say nothing rather than render an empty rail. The office
     controls this with `visibleOnSite`, and a section that insists on existing
     would advertise a product nobody can buy. */
  if (groups.length === 0) return null;

  /*
   * The homepage shows one service's plans, not every plan there is.
   *
   * Flattening the groups put five cards in a three-column rail — the two
   * office plans wrapped onto a second row underneath the household ones with
   * nothing to say they were for a different thing, and the ribbon landed on
   * VIP because VIP is now the middle of five. Both are the problem /abos was
   * just restructured to fix, reappearing on the higher-traffic page.
   *
   * The first group is the lowest-ordered service carrying plans, which is the
   * office's own ordering rather than a name written here. Everything else is
   * one click away on the button beside the heading — that is what the button
   * is for.
   */
  const teaser = groups[0]!.plans;

  return (
    <section id="plans" className="scroll-mt-28 py-20 lg:py-[76px]">
      <div className="hv-container">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <h2 className="display-type text-display-3 leading-[0.95]">
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
            {/*
             * On /abos this pointed at /abos.
             *
             * The button that says "compare plans" navigated to the page you
             * were already standing on: the click did nothing, and the one
             * thing on the page it was naming — the comparison table — sits
             * three sections below and was never linked from anywhere. It
             * scrolls there now. On the homepage it still crosses to the page.
             */}
            <Button
              href={byService ? "/abos#vergleich" : "/abos"}
              variant="red"
              size="md"
            >
              {t.actions.comparePlans}
            </Button>
          </motion.div>
        </div>

        {byService ? (
          <div id="pricing" className="scroll-mt-28">
            {/*
             * Tabs, once there is more than one service.
             *
             * Stacked, the two rails ran to nearly three screens and nothing at
             * the top said the second one was down there — somebody looking for
             * an office plan had to scroll past every household plan to find
             * out we sell one. Jump links fixed the finding and not the
             * reading: you still landed in a wall of five cards with no way to
             * put the ones that are not yours out of view.
             *
             * Radix Tabs rather than a hand-rolled strip, for the arrow-key and
             * Home/End behaviour — and because the panel it opens is a real
             * tabpanel, so the rail is announced as the content of the tab
             * rather than as five more articles on the page.
             */}
            {groups.length > 1 ? (
              <Tabs defaultValue={groups[0]!.service.slug} className="mt-12">
                <TabsList aria-label={p("byServiceNav")}>
                  {groups.map((group) => (
                    <TabsTrigger key={group.service.slug} value={group.service.slug}>
                      {group.service.name[routingLocale]}
                      <span data-numeric className="opacity-60">
                        {group.plans.length}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {groups.map((group) => (
                  <TabsContent key={group.service.slug} value={group.service.slug} className="mt-8">
                    {/* The service still gets said in words inside the panel.
                        The tab is a control, and a control is not a caption —
                        with the strip scrolled off, the rail would once again
                        be five prices with nothing saying what they buy. */}
                    <p className="text-ink-secondary max-w-[70ch] text-body">
                      {group.service.short[routingLocale]}
                    </p>
                    {/* Not force-mounted, unlike the comparison table below.
                        These cards reveal on scroll, and a panel that mounts
                        while `display: none` never intersects anything — it
                        would open on five cards frozen at `opacity: 0`. The
                        comparison keeps every plan in the DOM for the readers
                        this costs. */}
                    <PlanRail
                      plans={group.plans}
                      keyed={`${locale}-${group.service.slug}`}
                      immediate
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="mt-12">
                {/* Named even with one group. The question this answers — "does
                    this plan cover *my* job?" — is the same whether the page
                    carries one service or five, and it went unanswered on a
                    page whose three cards were all household cleaning. */}
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="text-ink text-2xl tracking-[0.01em]">
                    {groups[0]!.service.name[routingLocale]}
                  </h3>
                  <p className="text-ink-secondary text-body">
                    {groups[0]!.service.short[routingLocale]}
                  </p>
                </div>
                <PlanRail
                  plans={groups[0]!.plans}
                  keyed={`${locale}-${groups[0]!.service.slug}`}
                />
              </div>
            )}
          </div>
        ) : (
          <PlanRail plans={teaser} keyed={locale} id="pricing" className="mt-16 scroll-mt-28" />
        )}
      </div>
    </section>
  );
}

/** One row of plan cards, staggered in as a row. */
function PlanRail({
  plans,
  keyed,
  id,
  className = "mt-8",
  immediate = false,
}: {
  plans: Plan[];
  keyed: string;
  id?: string;
  className?: string;
  /**
   * Reveal on mount instead of on scroll.
   *
   * Set inside a tab panel, where "once it scrolls into view" is the wrong
   * question: the reader has just clicked the tab, so the answer is now. A
   * scroll trigger there is also one bad frame away from the failure this
   * codebase has already been bitten by twice — a panel that mounts without a
   * frame never intersects anything, and the rail opens on cards frozen at
   * `opacity: 0`. On the page itself the scroll trigger is still right, and
   * still what runs.
   */
  immediate?: boolean;
}) {
  const recommended = recommendedPlan(plans);
  const reveal = immediate
    ? ({ animate: "show" } as const)
    : ({ whileInView: "show", viewport: { once: true, amount: 0.12 } } as const);

  return (
    <motion.div
      id={id}
      key={keyed}
      initial="hidden"
      {...reveal}
      variants={stagger(0.12)}
      className={`grid items-center gap-y-10 lg:gap-4 ${
        /* The design's asymmetric three columns raise the middle card. With two
           plans there is no middle, so equal columns — the ratio exists to
           make one card taller, and applied to a pair it just makes the left
           one narrower for no reason. */
        plans.length === 3
          ? "lg:grid-cols-[minmax(0,423fr)_minmax(0,466fr)_minmax(0,423fr)]"
          : plans.length === 2
            ? "lg:grid-cols-2"
            : "lg:grid-cols-3"
      } ${className}`}
    >
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          /* Same answer the comparison table marks. See `recommendedPlan`. */
          featured={recommended?.id === plan.id}
          immediate={immediate}
        />
      ))}
    </motion.div>
  );
}

function PlanCard({
  plan,
  featured,
  immediate,
}: {
  plan: Plan;
  featured: boolean;
  immediate: boolean;
}) {
  const t = useContent();
  const p = useTranslations("site.plans");
  const rhythmT = useTranslations("admin.rhythm");
  const routingLocale = useRoutingLocale() as Locale;
  const saving = planSaving(plan);

  return (
    <motion.article
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
          {...(immediate
            ? { animate: { opacity: 1, y: 0, scale: 1 } }
            : { whileInView: { opacity: 1, y: 0, scale: 1 }, viewport: inViewLoose })}
          transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 20 }}
          className="bg-accent absolute -top-5 left-1/2 -translate-x-1/2 rounded-full px-6 py-2.5 text-body font-medium whitespace-nowrap text-ink-inverse"
        >
          {p("recommended")}
        </motion.span>
      ) : null}

      <h3 className="text-xl tracking-[0.02em]">{plan.name[routingLocale]}</h3>
      <p className={`mt-4 text-base ${featured ? "text-ink-inverse/70" : "text-ink-secondary"}`}>
        {rhythmT(planRhythm(plan))}
      </p>

      {saving ? (
        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* The struck figure is meaningless read aloud on its own — a screen
              reader announces two prices and no relation between them — so the
              label says which is which. */}
          <span className="sr-only">{p("wasPrice")}</span>
          <s
            data-numeric
            className={`text-lg ${featured ? "text-ink-inverse/55" : "text-ink-tertiary"}`}
          >
            <Money amount={saving.listPrice} />
          </s>
          <span
            className={`rounded-full px-2.5 py-1 text-[13px] font-medium ${
              featured ? "bg-accent text-ink-inverse" : "bg-accent-subtle text-ink-accent"
            }`}
          >
            {p("saveBadge", { percent: saving.percent })}
          </span>
        </p>
      ) : null}

      <p
        data-numeric
        className={`display-type ${saving ? "mt-2.5" : "mt-6"} text-figure-3 leading-[0.82] whitespace-nowrap ${
          featured ? "text-ink-inverse" : "text-ink"
        }`}
      >
        <Counter
          to={plan.price}
          duration={1.4}
          format={(v) => formatChf(Math.round(v), routingLocale)}
        />
      </p>

      <p className={`mt-6 text-base ${featured ? "text-ink-inverse/70" : "text-ink-secondary"}`}>
        {p("priceNote", { months: plan.validityMonths, visits: plan.includedVisits })}
      </p>

      <div className={`my-7 h-px w-full ${featured ? "bg-page/18" : "bg-line"}`} />

      <motion.ul
        initial="hidden"
        {...(immediate
          ? { animate: "show" as const }
          : { whileInView: "show" as const, viewport: inViewLoose })}
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
            <Check className={`mt-1 h-4 w-4 shrink-0 ${featured ? "text-ink-accent" : "text-ink"}`} />
            <span className={`text-base ${featured ? "text-ink-inverse" : "text-ink"}`}>
              {f[routingLocale] || f.de}
            </span>
          </motion.li>
        ))}
      </motion.ul>

      <Button
        href={`/anfrage?abo=${plan.id}`}
        variant={featured ? "red" : "navy"}
        surface={featured ? "inverse" : "page"}
        className="mt-9 w-full"
      >
        {t.actions.startPlan}
      </Button>
    </motion.article>
  );
}
