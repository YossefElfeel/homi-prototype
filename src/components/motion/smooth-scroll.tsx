'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Inertial scrolling, so the scroll-linked transforms settle instead of
 * snapping frame to frame.
 *
 * Off for two audiences, both deliberate: anyone who asked for reduced motion,
 * and coarse pointers, where the platform's own momentum is already better
 * than this and fighting it is what makes a hijacked page feel broken on a
 * phone.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduce || coarse) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    /* Exposed so tooling can move the page. Lenis owns the scroll position and
       pulls `window.scrollTo` straight back, so without this a screenshot pass
       or an automated check can only ever see the top of the page. */
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
