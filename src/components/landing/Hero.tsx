"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/landing/Button";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { ArrowUpRight } from "@/components/landing/icons";
import { EASE } from "@/components/landing/motion";
import { heroAvatars } from "@/content/landing";
import { useContent, useLocale } from "@/components/landing/use-landing-content";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useContent();
  const { locale } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // The photo drifts slower than the card it sits in, and the copy leaves first.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section id="top" ref={ref} className="relative px-3 pt-3 sm:px-7 sm:pt-7">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE }}
        className="bg-inverse relative h-[923px] max-h-[calc(100svh-12px)] min-h-[600px] overflow-hidden rounded-3xl sm:max-h-[calc(100vh-28px)] sm:min-h-[640px] sm:rounded-[32px]"
      >
        <motion.div
          style={{ y: imageY, scale: imageScale }}
          className="absolute inset-0 will-change-transform"
        >
          <Image
            src="/img/hero.webp"
            alt="A bright Swiss living room after a Homivaro clean"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>

        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.52) 42%, rgba(0,0,0,0.34) 80%, rgba(0,0,0,0) 100%)",
          }}
        />

        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative flex h-full flex-col justify-end px-6 pb-24 sm:px-10 lg:px-15 lg:pb-[130px]"
        >
          <h1 className="display-type text-ink-inverse">
            {/* Re-keyed on locale so the mask reveal replays when copy changes. */}
            <DisplayLines
              key={locale}
              immediate
              delay={0.3}
              className="block text-[clamp(42px,7.55vw,110px)] leading-[0.9]"
            >
              {t.hero.headline.map((line, i) => (
                <span key={i} className="block">
                  {line.map((part, j) => (
                    <span key={j} className={part.outline ? "ml-[0.16em]" : undefined}>
                      {part.t}
                    </span>
                  ))}
                </span>
              ))}
            </DisplayLines>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.85 }}
            className="mt-6 max-w-[660px] text-[17px] leading-[1.5] text-ink-inverse/75 sm:text-lg"
          >
            {t.hero.sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.98 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Button href="/anfrage" variant="red">
              {t.actions.quote}
            </Button>
            <Button href="/preise" variant="white" arrow={false}>
              {t.actions.pricing}
            </Button>
          </motion.div>
        </motion.div>

        <HeroBadge />
      </motion.div>

      <HeroTags />
    </section>
  );
}

/** Floating social-proof card, bottom right of the hero image. */
function HeroBadge() {
  const t = useContent();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, y: 16 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay: 1.15 }}
      className="absolute right-6 bottom-[104px] hidden w-[262px] rounded-2xl bg-page/92 p-4 backdrop-blur-md lg:right-12 lg:bottom-[62px] lg:block"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-ink text-[15px] leading-[1.35]">
          {t.hero.badge.line1}
          <br />
          <span className="text-ink-secondary">{t.hero.badge.line2}</span>
        </p>
        <Link
          href="/leistungen"
          aria-label={t.actions.services}
          className="bg-inverse hover:bg-accent group grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-inverse transition-colors duration-300"
        >
          <ArrowUpRight className="h-4 w-4 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="bg-line mt-4 h-px w-full" />

      <div className="mt-3 flex items-center justify-between">
        <div className="flex">
          {heroAvatars.map((src, i) => (
            <motion.span
              key={src}
              initial={{ opacity: 0, scale: 0.5, x: -6 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{
                delay: 1.35 + i * 0.07,
                type: "spring",
                stiffness: 320,
                damping: 20,
              }}
              className="-mr-3 block h-10 w-10 overflow-hidden rounded-full ring-2 ring-page last:mr-0"
            >
              <Image src={src} alt="" width={96} height={96} className="h-full w-full object-cover" />
            </motion.span>
          ))}
        </div>
        <span data-numeric className="display-type text-ink text-2xl normal-case tracking-normal">
          {t.hero.badge.count}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * The hashtag row punches a notch out of the hero card's bottom-left corner.
 * The white block plus the wedge to its right reproduce the stepped silhouette
 * from the design.
 */
function HeroTags() {
  const t = useContent();

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-20 flex max-w-full items-end pl-3 sm:pl-7">
      <div className="hidden h-[68px] items-center gap-4 bg-page pr-1 sm:flex">
        {t.hero.tags.map((tag, i) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 1.05 + i * 0.09 }}
            className={`pointer-events-auto rounded-full px-5 py-2.5 text-[15px] font-medium whitespace-nowrap transition-colors duration-300 ${
              i === 0
                ? "bg-inverse hover:bg-accent text-ink-inverse"
                : "bg-sunken text-ink hover:bg-inverse hover:text-ink-inverse"
            }`}
          >
            {tag}
          </motion.span>
        ))}
      </div>
      <svg
        width="74"
        height="68"
        viewBox="0 0 74 68"
        className="hidden shrink-0 sm:block"
        aria-hidden
      >
        <path d="M0 0h6.5a10 10 0 0 1 8 4L72 62a8 8 0 0 0 2 6H0Z" fill="#fff" />
      </svg>
    </div>
  );
}
