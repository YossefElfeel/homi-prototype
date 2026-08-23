'use client';

import { MotionConfig } from 'motion/react';

/**
 * `reducedMotion="user"` resolves every transform and layout animation
 * instantly for visitors who ask for it, while opacity still cross-fades.
 *
 * That combination is the point. Disabling the animations outright would leave
 * anything with a `hidden` variant sitting at `opacity: 0` for ever — the same
 * failure the IntersectionObserver reveal in ./reveal.tsx guards against, and
 * the reason a reveal that can permanently hide content is a bug rather than
 * an effect.
 */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
