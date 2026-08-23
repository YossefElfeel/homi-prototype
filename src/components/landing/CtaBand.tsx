"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/landing/Button";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { Phone } from "@/components/landing/icons";
import { EASE, inViewLoose } from "@/components/landing/motion";
import { contact } from "@/content/landing";
import { useContent, useLocale } from "@/components/landing/use-landing-content";

export function CtaBand() {
  const t = useContent();
  const { locale } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Slow drift on the grain layer so the flat red plane has some depth.
  const grainY = useTransform(scrollYProgress, [0, 1], ["-14%", "14%"]);

  return (
    <section id="contact" ref={ref} className="bg-accent relative scroll-mt-24 overflow-hidden">
      <motion.div
        aria-hidden
        style={{ y: grainY }}
        className="hv-grain absolute inset-x-0 -top-1/4 h-[150%]"
      />

      <div className="hv-container relative py-24 text-center lg:py-[100px]">
        <h2 className="display-type mx-auto max-w-[1100px] text-[clamp(38px,8.1vw,118px)] leading-[0.92] text-ink-inverse">
          <DisplayLines key={locale}>
            {[
              <span key="a">
                {t.cta.before} {t.cta.outline} {t.cta.after}
              </span>,
            ]}
          </DisplayLines>
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inViewLoose}
          transition={{ duration: 0.75, ease: EASE, delay: 0.18 }}
          className="mx-auto mt-7 max-w-[1000px] text-[17px] leading-[1.55] text-ink-inverse/85 sm:text-lg"
        >
          {t.cta.body}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inViewLoose}
          transition={{ duration: 0.75, ease: EASE, delay: 0.28 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Button href="/anfrage" variant="navy">
            {t.actions.quote}
          </Button>
          <Button
            href={contact.phoneHref}
            variant="white"
            arrow={false}
            icon={<Phone className="h-4 w-4" />}
            className="flex-row-reverse"
          >
            {contact.phone}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
