"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { Reveal } from "@/components/landing/Reveal";
import { ChevronLeft, ChevronRight, Star } from "@/components/landing/icons";
import { EASE, cardRise, inViewLoose, stagger } from "@/components/landing/motion";
import { reviewAvatars } from "@/content/landing";
import { useContent, useLocale } from "@/components/landing/use-landing-content";

const GAP = 16;

export function Testimonials() {
  const t = useContent();
  const { locale } = useLocale();
  const items = t.testimonials.items;
  const total = items.length;
  const [page, setPage] = useState(0);
  const [perView, setPerView] = useState(3);
  const reduce = useReducedMotion();

  useEffect(() => {
    const set = () => {
      const w = window.innerWidth;
      setPerView(w < 720 ? 1 : w < 1100 ? 2 : 3);
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  const maxPage = Math.max(0, total - perView);
  const at = Math.min(page, maxPage);

  return (
    <section className="overflow-x-clip pt-10 pb-20 lg:pb-[76px]">
      <div className="hv-container">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <Reveal>
            <p className="display-type text-ink-accent text-[clamp(70px,9vw,121px)] leading-[0.72]">
              160+
            </p>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex">
                {reviewAvatars.map((src, i) => (
                  <motion.span
                    key={src}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={inViewLoose}
                    transition={{
                      delay: 0.15 + i * 0.07,
                      type: "spring",
                      stiffness: 320,
                      damping: 20,
                    }}
                    className="-mr-2.5 block h-10 w-10 overflow-hidden rounded-full ring-2 ring-page last:mr-0"
                  >
                    <Image
                      src={src}
                      alt=""
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </motion.span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-ink text-lg font-medium">5.0</span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={inViewLoose}
                        transition={{
                          delay: 0.3 + i * 0.08,
                          type: "spring",
                          stiffness: 400,
                          damping: 16,
                        }}
                      >
                        <Star className="text-ink-accent h-3.5 w-3.5" />
                      </motion.span>
                    ))}
                  </span>
                </div>
                <p className="text-ink-secondary mt-1 text-[15px]">{t.testimonials.rating}</p>
              </div>
            </div>
          </Reveal>

          <div className="lg:pb-2">
            <Reveal>
              <p className="text-ink-accent text-lg font-medium">{t.testimonials.eyebrow}</p>
            </Reveal>
            <h2 className="display-type text-ink mt-2 text-[clamp(32px,5.7vw,82px)] leading-[0.95]">
              <DisplayLines key={locale}>
                {[<span key="a">{t.testimonials.headline}</span>]}
              </DisplayLines>
            </h2>
          </div>
        </div>

        <div className="mt-14 overflow-hidden">
          {/* The reveal is driven from the track, not from each card: cards
              past the third are clipped by the carousel and would never
              intersect the viewport, so a per-card trigger left them blank
              when you paged to them. */}
          <motion.ul
            key={locale}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger(0.07)}
            animate={{ x: `calc(${-at * (100 / perView)}% - ${at * GAP}px)` }}
            transition={reduce ? { duration: 0 } : { duration: 0.85, ease: EASE }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) setPage(Math.min(at + 1, maxPage));
              else if (info.offset.x > 70) setPage(Math.max(at - 1, 0));
            }}
            className="flex gap-4"
          >
            {items.map((item) => (
              <motion.li
                key={item.name}
                variants={cardRise}
                whileHover={{ y: -6 }}
                style={{
                  width: `calc(${100 / perView}% - ${(GAP * (perView - 1)) / perView}px)`,
                }}
                className="hv-card hv-card-dark group shrink-0 rounded-2xl p-6 select-none"
              >
                <p className="text-[15px] leading-[1.62] text-ink-inverse/55 transition-colors duration-400 group-hover:text-ink-inverse/70">
                  <span className="text-ink-inverse">{item.lead}</span>{" "}
                  {item.quote.startsWith(item.lead)
                    ? item.quote.slice(item.lead.length).trim()
                    : item.quote}
                </p>
                <div className="mt-7 flex items-center gap-3">
                  <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={item.avatar}
                      alt=""
                      width={144}
                      height={144}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                  <div>
                    <p className="text-[17px] font-medium text-ink-inverse">{item.name}</p>
                    <p className="mt-0.5 text-sm text-ink-inverse/55">{item.country}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <NavButton
            label={t.actions.prev}
            disabled={at === 0}
            onClick={() => setPage(Math.max(at - 1, 0))}
          >
            <ChevronLeft className="h-5 w-5" />
          </NavButton>
          <NavButton
            variant="red"
            label={t.actions.next}
            disabled={at === maxPage}
            onClick={() => setPage(Math.min(at + 1, maxPage))}
          >
            <ChevronRight className="h-5 w-5" />
          </NavButton>
        </div>
      </div>
    </section>
  );
}

function NavButton({
  children,
  label,
  onClick,
  disabled,
  variant = "ghost",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "red";
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.06 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={`grid h-11 w-11 place-items-center rounded-xl transition-colors duration-300 disabled:opacity-35 ${
        variant === "red"
          ? "bg-accent hover:bg-inverse text-ink-inverse"
          : "border-ink/25 text-ink hover:bg-inverse border hover:text-ink-inverse"
      }`}
    >
      {children}
    </motion.button>
  );
}
