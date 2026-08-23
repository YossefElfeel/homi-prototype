import type { Transition, Variants } from "motion/react";

/** Shared easing curve — long tail, no overshoot. Matches the CSS tokens. */
export const EASE = [0.16, 1, 0.3, 1] as const;
export const EASE_SWIFT = [0.4, 0, 0.2, 1] as const;

export const spring: Transition = {
  type: "spring",
  stiffness: 140,
  damping: 20,
  mass: 0.9,
};

/** Once-only viewport trigger used by every scroll reveal on the page. */
export const inView = { once: true, amount: 0.35, margin: "0px 0px -12% 0px" } as const;
export const inViewLoose = { once: true, amount: 0.15, margin: "0px 0px -8% 0px" } as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

/** Parent that walks its children in. */
export const stagger = (each = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren: delay } },
});

/** A line of display type rising out of its own clipping mask. */
export const lineRise: Variants = {
  hidden: { y: "115%" },
  show: {
    y: "0%",
    transition: { duration: 1.05, ease: EASE },
  },
};

export const cardRise: Variants = {
  hidden: { opacity: 0, y: 34, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: EASE },
  },
};
