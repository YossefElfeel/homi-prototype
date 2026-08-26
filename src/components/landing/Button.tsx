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

/**
 * The plane the button is standing on. Only the three flat ones are named —
 * the hero photograph is not a plane, and no wash disappears into it.
 */
type Surface = "page" | "inverse" | "accent";

type Wash = "navy" | "red" | "white";

const WASH_FILL: Record<Wash, string> = {
  navy: "bg-inverse",
  red: "bg-accent",
  white: "bg-page",
};

/** What the label has to become once the wash has covered the button. */
const WASH_LABEL: Record<Wash, string> = {
  navy: "hover:text-ink-inverse",
  red: "hover:text-ink-inverse",
  white: "hover:text-ink",
};

/** The wash a given surface would swallow whole. */
const SURFACE_WASH: Record<Surface, Wash> = {
  page: "white",
  inverse: "navy",
  accent: "red",
};

/**
 * Hover wipes a colour up from the bottom — and which colour is not a property
 * of the button alone. The wash has to differ from the surface the button
 * stands on, or the control dissolves into its background at the exact moment
 * the pointer says it is live.
 *
 * That was happening in three places at once, because the washes were written
 * as if every button sat on the white page. The navy button on the red CTA
 * band washed accent red — the band's own colour. The red button on the navy
 * masthead, and the red button on the featured (navy) plan card, both washed
 * navy. In all three the button vanished on hover and left only its own edge.
 *
 * So each variant carries a second choice, and the surface decides. Nothing
 * changes for a button on the white page: those already contrasted.
 */
const variants: Record<Variant, { base: string; wash: Wash; alt: Wash }> = {
  red: { base: "bg-accent text-ink-inverse", wash: "navy", alt: "white" },
  navy: { base: "bg-inverse text-ink-inverse", wash: "red", alt: "white" },
  white: { base: "bg-page text-ink", wash: "navy", alt: "red" },
  outline: { base: "border border-line text-ink bg-transparent", wash: "navy", alt: "red" },
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-body",
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
  /** The plane this button is placed on, so the hover wash cannot match it. */
  surface?: Surface;
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
  surface = "page",
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

  const v = variants[variant];
  const wash = v.wash === SURFACE_WASH[surface] ? v.alt : v.wash;

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
        v.base
      } ${sizes[size]} ${WASH_LABEL[wash]} ${className}`}
      {...rest}
    >
      <span
        aria-hidden
        className={`absolute inset-0 translate-y-full rounded-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 ${WASH_FILL[wash]}`}
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
