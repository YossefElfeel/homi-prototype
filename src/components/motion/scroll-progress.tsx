'use client';

import { motion, useScroll, useSpring } from 'motion/react';

/**
 * M13 — reading progress, pinned to the top of the viewport.
 *
 * Decorative in the strict sense, so it is `aria-hidden`: the same information
 * is already in the scrollbar, and announcing a second one would be noise.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-100 h-[3px] origin-left bg-accent"
    />
  );
}
