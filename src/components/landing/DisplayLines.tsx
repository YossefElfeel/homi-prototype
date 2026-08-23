"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { inViewLoose, lineRise, stagger } from "@/components/landing/motion";

type Props = {
  children: ReactNode[];
  className?: string;
  delay?: number;
  /** Fire on mount rather than on scroll — used by the hero. */
  immediate?: boolean;
  each?: number;
  /** Set when the caller renders its own accessible copy of the text. */
  ariaHidden?: boolean;
};

/**
 * Display headline where each line sits in its own overflow-hidden mask and
 * slides up from below. One mask per visual line, so the clip edge always
 * lands on the baseline gap rather than mid-glyph.
 */
export function DisplayLines({
  children,
  className,
  delay = 0,
  immediate = false,
  each = 0.09,
  ariaHidden = false,
}: Props) {
  const animateProps = immediate
    ? { animate: "show" as const }
    : { whileInView: "show" as const, viewport: inViewLoose };

  return (
    <motion.span
      aria-hidden={ariaHidden || undefined}
      className={className}
      initial="hidden"
      variants={stagger(each, delay)}
      {...animateProps}
    >
      {children.map((line, i) => (
        <span className="hv-mask-line" key={i}>
          <motion.span className="block will-change-transform" variants={lineRise}>
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
