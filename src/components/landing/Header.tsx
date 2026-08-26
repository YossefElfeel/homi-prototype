"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/landing/Button";
import { LocaleSwitch } from "@/components/landing/locale-switch";
import { ArrowRight } from "@/components/landing/icons";
import { EASE } from "@/components/landing/motion";
import { contact } from "@/content/landing";
import { useContent } from "@/components/landing/use-landing-content";
import { Link, usePathname } from "@/i18n/navigation";

/* The mobile menu items animate in, so they need a motion-wrapped Link rather
   than a motion.a — a bare anchor would drop the locale prefix. */
const MotionNavLink = motion.create(Link);

/**
 * Sits inside the hero card at rest. Once the hero scrolls away it detaches
 * into a floating frosted bar — same pills, new ground.
 *
 * At rest the bar is transparent with white type, because in the design it is
 * lying on a photograph. Only the homepage has that photograph. On the other
 * sixteen routes the same bar would be white type on a white page, so it
 * starts detached there and the page reserves its height — a fixed bar over a
 * page with no hero otherwise sits on top of the first heading.
 */
export function Header() {
  const t = useContent();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  /* The design tracked the section in view, because it was one page. These
     six items point at six routes now, so the active one is the route you are
     on — same pill, a question that actually has an answer here. */
  const pathname = usePathname();
  const activeHref = pathname;
  const overHero = pathname === "/";
  const stuck = !overHero || scrolled;

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 140));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
        className="pointer-events-none fixed inset-x-0 top-0 z-50"
      >
        {/* Blurs whatever slides under the floating bar so a half line of copy
            never peeks out above it. Blur only, no tint, so it works over the
            white, grey, red and navy sections alike. */}
        <motion.div
          aria-hidden
          animate={{ opacity: stuck ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="absolute inset-x-0 top-0 h-[76px] backdrop-blur-[7px] [mask-image:linear-gradient(to_bottom,#000_58%,transparent)]"
        />
        {/*
         * At rest the bar sits inside the hero card, so its padding is the
         * card's own inset plus a gutter — 12+16 on phones, 28+20 from sm,
         * 28+40 at lg, which lands the logo where the design puts it. Once
         * stuck the card is gone and the bar floats near the viewport edge.
         * Classes rather than animated values so the steps follow breakpoints.
         */}
        <div
          className={`mx-auto flex max-w-[1440px] items-center transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            stuck
              ? "px-3 pt-2.5 sm:px-5"
              : "px-7 pt-7 sm:px-12 sm:pt-12 lg:px-[68px] lg:pt-[68px]"
          }`}
        >
          <motion.div
            animate={
              stuck
                ? {
                    backgroundColor: "rgba(255,255,255,0.9)",
                    boxShadow: "0 12px 40px -12px rgba(11,27,63,0.3)",
                    padding: 6,
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0)",
                    boxShadow: "0 0px 0px 0px rgba(11,27,63,0)",
                    padding: 0,
                  }
            }
            transition={{ duration: 0.5, ease: EASE }}
            style={{ backdropFilter: stuck ? "blur(18px)" : "none", borderRadius: 999 }}
            className="pointer-events-auto flex w-full items-center gap-2 sm:gap-3"
          >
            <Link
              href="/"
              className="grid h-10 shrink-0 place-items-center rounded-full bg-page px-3 shadow-[0_2px_10px_-4px_rgba(11,27,63,0.35)] sm:h-11 sm:px-4"
              aria-label="Homivaro"
            >
              <Image
                src="/img/logo.png"
                alt="Homivaro"
                width={694}
                height={200}
                priority
                className="h-[26px] w-auto sm:h-[30px]"
              />
            </Link>

            <nav className="mx-auto hidden items-center gap-1 xl:flex">
              {t.nav.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className="group relative rounded-full px-4 py-2.5 text-body font-medium"
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="nav-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-page"
                      />
                    ) : (
                      /* Nothing behind the item at rest. A resting tint on all
                         six made the bar read as six buttons with one of them
                         merely lighter, which is the opposite of what the pill
                         is for: the pill says *where you are*, and it can only
                         say it if it is the only fill on the bar. Hover keeps
                         its own tint, because that answers a different
                         question — what would happen if I clicked. */
                      <span
                        className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                          stuck ? "group-hover:bg-inverse/8" : "group-hover:bg-page/15"
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 transition-colors duration-300 ${
                        isActive
                          ? "text-ink"
                          : stuck
                            ? "text-ink/60 group-hover:text-ink"
                            : "text-ink-inverse/85 group-hover:text-ink-inverse"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:gap-3 xl:ml-0">
              <LocaleSwitch tone={stuck ? "dark" : "light"} />
              <span className="hidden sm:block">
                <Button href="/anfrage" variant="red" size={stuck ? "md" : "lg"}>
                  {t.actions.quote}
                </Button>
              </span>
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={t.actions.menu}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors sm:h-11 sm:w-11 xl:hidden ${
                  stuck ? "bg-inverse text-ink-inverse" : "bg-page/15 text-ink-inverse backdrop-blur"
                }`}
              >
                <span aria-hidden className="flex flex-col gap-[5px]">
                  <span className="block h-[2px] w-5 rounded bg-current" />
                  <span className="block h-[2px] w-5 rounded bg-current" />
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {!overHero ? <div aria-hidden className="h-[76px] sm:h-[88px]" /> : null}

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-inverse fixed inset-0 z-80 overflow-y-auto xl:hidden"
          >
            <div className="flex min-h-full flex-col px-6 pt-6 pb-10">
              <div className="flex items-center justify-between">
                <span className="grid h-11 place-items-center rounded-full bg-page px-3">
                  <Image
                    src="/img/logo.png"
                    alt="Homivaro"
                    width={694}
                    height={200}
                    className="h-[30px] w-auto"
                  />
                </span>
                <div className="flex items-center gap-3">
                  <LocaleSwitch tone="light" />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="grid h-11 w-11 place-items-center rounded-full bg-page/10 text-ink-inverse"
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
                      <path
                        d="m5 5 10 10M15 5 5 15"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <nav className="mt-12 flex flex-col">
                {t.nav.map((item, i) => (
                  <MotionNavLink
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i + 0.1, duration: 0.6, ease: EASE }}
                    className="display-type flex items-center justify-between border-b border-page/12 py-5 text-display-floor text-ink-inverse"
                  >
                    {item.label}
                    <ArrowRight className="h-5 w-5 text-ink-inverse/40" />
                  </MotionNavLink>
                ))}
              </nav>

              <div className="mt-auto pt-10">
                <Button
                  href="/anfrage"
                  variant="red"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  {t.actions.quote}
                </Button>
                <a
                  href={contact.phoneHref}
                  className="mt-4 block text-center text-ink-inverse/70"
                >
                  {contact.phone}
                </a>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
