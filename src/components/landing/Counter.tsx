"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { EASE } from "@/components/landing/motion";

type Props = {
  to: number;
  /** Digits after the decimal point. Ignored when `format` is given. */
  decimals?: number;
  duration?: number;
  className?: string;
  /**
   * How to write the value at each tick.
   *
   * A price is not a bare figure — it carries a currency and Swiss thousands
   * separators — and a counter that dropped those would animate `3440` into
   * place under a heading that promised `CHF 3'440.–`. Formatting on the tick
   * keeps the counting figure and the resting figure identical in every
   * respect but the digits.
   */
  format?: (value: number) => string;
};

/**
 * Counts from zero to `to` the first time it scrolls into view.
 *
 * **The rendered value is the final one, always.** The design build held the
 * figure in a motion value and rendered that, which puts a literal `0` in the
 * server HTML: the stats band shipped as `CHF 0.–`, `0 h` and `0 municipalities`
 * to anything that does not run the animation — a crawler, a failed hydration,
 * or simply a tab that never gets a frame. Those four numbers are the entire
 * point of the section, so the markup carries the real ones and the animation
 * overwrites them. The failure mode becomes "the number does not count up",
 * which costs nothing, instead of "the number is wrong".
 *
 * That is also why this writes through the ref rather than rendering a motion
 * value: the tick goes straight to the DOM instead of re-rendering the section
 * sixty times a second, and the initial paint stays server-truthful.
 */
export function Counter({ to, decimals = 0, duration = 1.6, className, format }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  const write = format ?? ((v: number) => v.toFixed(decimals));
  /* Held in a ref rather than listed as a dependency. A caller writes the
     formatter inline, so it is a new function on every render of the parent —
     as a dependency it would restart the count from zero each time the store
     around it changed, which on the plans section is mid-animation. Written in
     an effect, not during render: a ref written during render is read by a
     concurrent re-render that was never committed. */
  const writeRef = useRef(write);
  useEffect(() => {
    writeRef.current = write;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node || !visible || reduce) return;

    const controls = animate(0, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = writeRef.current(v);
      },
      // Land exactly on the value the markup already had, so a rounding wobble
      // on the last frame cannot leave 23 on screen.
      onComplete: () => {
        node.textContent = writeRef.current(to);
      },
    });

    return () => controls.stop();
  }, [visible, reduce, to, duration]);

  return (
    <span ref={ref} className={className}>
      {write(to)}
    </span>
  );
}
