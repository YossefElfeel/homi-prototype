"use client";

import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useRef } from "react";
import { ArrowRight } from "./icons";
import { Link } from "@/i18n/navigation";

/**
 * Internal links go through next-intl so the locale prefix survives. The
 * design build was a single page and used bare anchors throughout; here a
 * bare `/preise` would drop a German visitor onto the English route.
 */
const MotionLink = motion.create(Link);

type Variant = "red" | "navy" | "white" | "outline";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  red: "bg-accent text-ink-inverse",
  navy: "bg-inverse text-ink-inverse",
  white: "bg-page text-ink",
  outline: "border border-line text-ink bg-transparent",
};

/** The sliding colour wash revealed on hover, per variant. */
const washes: Record<Variant, string> = {
  red: "bg-inverse",
  navy: "bg-accent",
  white: "bg-inverse",
  outline: "bg-inverse",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[15px]",
  lg: "h-[52px] px-7 text-base",
};

// Motion redefines these DOM handlers with its own signatures.
type AnchorProps = Omit<
  ComponentPropsWithoutRef<"a">,
  "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration" | "onDrag" | "onDragStart" | "onDragEnd" | "onTransitionEnd" | "ref" | "style"
>;

type Props = AnchorProps & {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

/**
 * Pill button. Hover does three things at once: a colour wash wipes up from the
 * bottom, the arrow leaves to the right while a second arrow enters from the
 * left, and the whole control drifts a few pixels toward the cursor.
 */
export function Button({
  variant = "red",
  size = "lg",
  arrow = true,
  icon,
  children,
  className = "",
  ...rest
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.5 });
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.5 });

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 12);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 8);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  // Dark wash under dark-on-light variants means the label has to flip to white.
  const flipsToWhite = variant === "white" || variant === "outline";

  const internal = typeof rest.href === "string" && rest.href.startsWith("/");
  const Comp = internal ? MotionLink : motion.a;

  return (
    <Comp
      ref={ref}
      style={{ x, y }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.97 }}
      className={`group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-medium whitespace-nowrap transition-colors duration-300 ${
        variants[variant]
      } ${sizes[size]} ${flipsToWhite ? "hover:text-ink-inverse" : ""} ${className}`}
      {...rest}
    >
      <span
        aria-hidden
        className={`absolute inset-0 translate-y-full rounded-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 ${washes[variant]}`}
      />
      <span className="relative z-10">{children}</span>
      {icon ? <span className="relative z-10">{icon}</span> : null}
      {arrow ? (
        <span className="relative z-10 block h-4 w-4 overflow-hidden">
          <ArrowRight className="absolute inset-0 h-4 w-4 transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-5" />
          <ArrowRight className="absolute inset-0 h-4 w-4 -translate-x-5 transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0" />
        </span>
      ) : null}
    </Comp>
  );
}
