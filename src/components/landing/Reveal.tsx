"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE, inViewLoose } from "@/components/landing/motion";

type Props = {
  children: ReactNode;
  /** Seconds of delay after the element enters the viewport. */
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "span";
};

/** Plain "rise and fade once visible" wrapper — the page's default reveal. */
export function Reveal({ children, delay = 0, y = 26, className, as = "div" }: Props) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={inViewLoose}
      transition={{ duration: 0.78, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}
