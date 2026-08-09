'use client';

import { Fragment, useEffect, useRef, useState } from 'react';

/**
 * Scroll-triggered reveals for the Kante direction.
 *
 * The reference template drives these with GSAP SplitText and ScrollTrigger —
 * both paid Club plugins. This reproduces the effect with an
 * IntersectionObserver and the CSS in globals.css: no runtime library, and it
 * falls back to plain text without JavaScript.
 *
 * `useReveal` only ever *removes* the pending state, so anything that fails to
 * observe stays visible rather than invisible. A reveal animation that can
 * hide content permanently is a bug, not an effect.
 */
function useReveal<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);
  // Initialised to match what the server rendered — never derived from
  // `typeof IntersectionObserver`, which differs across the boundary and would
  // hydrate into a mismatch.
  const [state, setState] = useState<'pending' | 'shown'>(enabled ? 'pending' : 'shown');

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;

    // No observer available (very old browser, or a test environment): show the
    // content on the next frame rather than synchronously here, which would
    // cause a cascading render.
    if (!node || typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(() => setState('shown'));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState('shown');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return { ref, state };
}

/**
 * Headline reveal. Words are measured after layout and grouped by the line
 * they actually landed on, so words on the same line rise together — that is
 * what separates a line reveal from a word-by-word typewriter.
 */
export function SplitReveal({
  text,
  enabled,
  className,
  as: Tag = 'span',
}: {
  text: string;
  enabled: boolean;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}) {
  const { ref, state } = useReveal<HTMLElement>(enabled);
  const [lines, setLines] = useState<number[]>([]);

  const words = text.split(' ');

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    function measure() {
      const spans = node!.querySelectorAll<HTMLElement>('.split-line');
      const tops: number[] = [];
      const map: number[] = [];
      spans.forEach((span) => {
        const top = Math.round(span.offsetTop);
        let index = tops.indexOf(top);
        if (index === -1) {
          tops.push(top);
          index = tops.length - 1;
        }
        map.push(index);
      });
      setLines(map);
    }

    measure();
    // Line breaks move with the viewport, and German at full length breaks
    // differently from English — re-measure rather than assume.
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, text, ref]);

  if (!enabled) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={className}
      data-reveal={state}
      aria-label={text}
    >
      {words.map((word, i) => (
        // The space must sit OUTSIDE the mask. Inside an overflow-hidden,
        // shrink-to-fit inline-block a trailing space is dropped, which welds
        // the words together — "REINIGUNGUND MÖBELMONTAGE".
        <Fragment key={`${word}-${i}`}>
          <span className="split-line" aria-hidden>
            <span
              className="split-word"
              style={{ '--line': lines[i] ?? 0 } as React.CSSProperties}
            >
              {word}
            </span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Block reveal for everything that is not a headline. */
export function Rise({
  enabled,
  delay = 0,
  className,
  children,
}: {
  enabled: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, state } = useReveal<HTMLDivElement>(enabled);

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <div
      ref={ref}
      className={className}
      data-rise={state}
      style={{ '--delay': delay } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
