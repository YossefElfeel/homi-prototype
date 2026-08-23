"use client";

import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/landing/Button";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { Reveal } from "@/components/landing/Reveal";
import { ArrowUpRight } from "@/components/landing/icons";
import { EASE } from "@/components/landing/motion";
import { useContent, useLocale } from "@/components/landing/use-landing-content";

const AUTOPLAY_MS = 3800;
/** Ignore wheel deltas for this long after a step, or one flick jumps three cards. */
const WHEEL_COOLDOWN_MS = 480;

/** Where a card sits, by how many places it is behind the front card. */
const slots = [
  { x: 0, y: 0, scale: 1, opacity: 1, z: 40 },
  { x: 0.778, y: 16, scale: 0.911, opacity: 1, z: 30 },
  { x: 1.467, y: 32, scale: 0.822, opacity: 1, z: 20 },
  { x: 2.05, y: 48, scale: 0.74, opacity: 0, z: 10 },
];

export function Services() {
  const t = useContent();
  const { locale } = useLocale();
  const items = t.services.items;
  const n = items.length;

  const stageRef = useRef<HTMLDivElement>(null);
  const onScreen = useInView(stageRef, { amount: 0.35 });
  const reduce = useReducedMotion();

  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);

  const go = useCallback((dir: 1 | -1) => setActive((a) => (a + dir + n) % n), [n]);

  /* Any deliberate move stops the autoplay for good. Restarting it under
     someone who just took the wheel is how a carousel loses an argument. */
  const step = useCallback(
    (dir: 1 | -1) => {
      setPaused(true);
      go(dir);
    },
    [go],
  );

  const jumpTo = useCallback((i: number) => {
    setPaused(true);
    setActive(i);
  }, []);

  /*
   * Advances on its own while the stack is on screen. Hovering deliberately
   * does not pause it — the pointer sits over these cards most of the time, so
   * pausing there would read as the carousel being broken. It stops while you
   * are dragging, and never runs for visitors who ask for reduced motion.
   */
  useEffect(() => {
    if (reduce || paused || dragging || !onScreen) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [reduce, paused, dragging, onScreen, n]);

  // Trackpad and wheel: a sideways gesture over the stack steps it. Vertical
  // intent is left alone so the page keeps scrolling normally.
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    let last = 0;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = e.timeStamp;
      if (now - last < WHEEL_COOLDOWN_MS) return;
      if (Math.abs(e.deltaX) < 8) return;
      last = now;
      step(e.deltaX > 0 ? 1 : -1);
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [step]);

  return (
    <section id="services" className="scroll-mt-28 overflow-x-clip py-20 lg:py-[70px]">
      <div className="hv-container grid items-start gap-12 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)] lg:gap-0">
        <div className="lg:pt-1 lg:pr-12">
          <h2 className="display-type text-[clamp(36px,5.7vw,82px)] leading-[0.95]">
            <DisplayLines key={locale}>
              {t.services.headline.map((line, i) => (
                <span key={i}>
                  {line.red ? <span className="text-ink-accent">{line.red} </span> : null}
                  <span className="text-ink">{line.navy}</span>
                </span>
              ))}
            </DisplayLines>
          </h2>

          <Reveal delay={0.12}>
            <p className="text-ink-secondary mt-6 max-w-[510px] text-[17px] leading-[1.55] sm:text-lg">
              {t.services.body}
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-8">
              <Button href="/leistungen" variant="red" size="md">
                {t.actions.services}
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} y={34} className="relative -mr-6 sm:-mr-10 lg:-mr-12">
          {/* Drag lives on the stage rather than on each card: a card sitting
              in slot 1 or 2 already carries an x offset, and constraining it
              to zero for the drag would rip it out of the stack. */}
          <motion.div
            ref={stageRef}
            role="group"
            aria-roledescription="carousel"
            aria-label={t.services.counter(active + 1, n)}
            tabIndex={0}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragStart={() => setDragging(true)}
            onDragEnd={(_, info) => {
              setDragging(false);
              if (info.offset.x < -60) step(1);
              else if (info.offset.x > 60) step(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                step(1);
              }
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                step(-1);
              }
            }}
            style={{ ["--card" as string]: "clamp(248px, 66vw, 360px)" }}
            className="relative h-[var(--card)] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing lg:[--card:clamp(248px,25.5vw,360px)]"
          >
            {items.map((service, i) => {
              const pos = (i - active + n) % n;
              const leaving = pos === n - 1;
              /* Non-null: `slots` has four entries and the index is clamped to 3.
                 This repo runs `noUncheckedIndexedAccess`, which the design
                 build did not. */
              const slot = slots[Math.min(pos, 3)]!;

              return (
                <motion.article
                  key={service.name}
                  animate={{
                    x: leaving ? "-120%" : `calc(var(--card) * ${slot.x})`,
                    y: leaving ? 0 : slot.y,
                    scale: leaving ? 0.86 : slot.scale,
                    opacity: leaving ? 0 : slot.opacity,
                    filter: pos === 0 ? "brightness(1)" : "brightness(0.86)",
                  }}
                  transition={{ duration: 0.85, ease: EASE }}
                  style={{
                    zIndex: leaving ? 0 : slot.z,
                    transformOrigin: "top left",
                    pointerEvents: pos < 3 ? "auto" : "none",
                  }}
                  className="group bg-inverse absolute top-0 left-0 h-[var(--card)] w-[var(--card)] overflow-hidden rounded-3xl shadow-[0_30px_70px_-40px_rgba(11,27,63,0.6)]"
                >
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(max-width: 1024px) 66vw, 360px"
                    className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,1) 100%)",
                    }}
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-6">
                    <div>
                      <p className="text-[15px] text-ink-inverse/85">{service.name}</p>
                      <p className="mt-1.5 text-lg font-semibold text-ink-inverse">
                        {service.price}
                      </p>
                    </div>
                    {pos === 0 ? (
                      <motion.a
                        href="/anfrage"
                        aria-label={service.name}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.25,
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="bg-accent pointer-events-auto grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-inverse transition-transform duration-400 hover:scale-110"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </motion.a>
                    ) : null}
                  </div>

                  {pos !== 0 ? (
                    <button
                      type="button"
                      onClick={() => jumpTo(i)}
                      aria-label={service.name}
                      className="absolute inset-0 cursor-pointer"
                    />
                  ) : null}
                </motion.article>
              );
            })}
          </motion.div>

          <div className="mt-8 flex items-center justify-between gap-4 pr-6 sm:justify-end sm:pr-10 lg:pr-12">
            <div className="flex items-center gap-3">
              {/*
               * The stack advances by itself every 3.8 seconds. WCAG 2.2.2 is
               * unambiguous that anything moving for more than five seconds
               * needs a way to stop it, and the design has none — so this is
               * an addition, kept as quiet as the rail it sits in.
               *
               * It does not pause on hover, which is the design's call and the
               * right one: the pointer rests over these cards most of the
               * time, and a stack that freezes whenever the mouse crosses it
               * reads as broken rather than considerate.
               */}
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                aria-pressed={paused}
                aria-label={paused ? t.actions.playServices : t.actions.pauseServices}
                className="text-ink hover:bg-inverse hover:text-ink-inverse border-line grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
              >
                {paused ? (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                    <path d="M4.5 3.2v9.6L13 8Z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                    <path d="M4.5 3h2.2v10H4.5zM9.3 3h2.2v10H9.3z" fill="currentColor" />
                  </svg>
                )}
              </button>
              <p
                aria-live="polite"
                className="text-ink text-[15px] font-medium whitespace-nowrap tabular-nums"
              >
                {t.services.counter(active + 1, n)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {items.map((service, i) => (
                <button
                  key={service.name}
                  type="button"
                  onClick={() => jumpTo(i)}
                  aria-label={service.name}
                  aria-current={i === active}
                  className="group py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
                >
                  <span
                    className={`block h-[3px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      i === active
                        ? "bg-accent w-8 sm:w-11"
                        : "bg-line group-hover:bg-ink-secondary w-4 sm:w-6"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
