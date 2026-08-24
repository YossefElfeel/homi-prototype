'use client';

import Image from 'next/image';
import { useId, useState } from 'react';

import { cn } from '@/lib/cn';

/**
 * Two photographs of one room with a divider you drag between them.
 *
 * The grid used to put the two frames side by side at half width each, which
 * is the one layout a before-and-after cannot use: the whole claim is *this
 * exact spot, changed*, and two small frames a gutter apart make the reader do
 * the alignment in their head. Overlaid at full width with a divider, the
 * change is the only thing that moves.
 *
 * **The control is a range input, not a drag handler.** A `pointerdown` /
 * `pointermove` implementation would have been fewer lines and would have shut
 * the gallery to anyone not using a mouse: no keyboard, no announced value, no
 * touch semantics that a screen reader knows what to do with. The input covers
 * the whole frame at zero opacity, so a click anywhere jumps the divider, a
 * drag moves it, and the arrow keys step it — for free and correctly.
 */
export function BeforeAfter({
  beforeSrc,
  afterSrc,
  alt,
  beforeLabel,
  afterLabel,
  sliderLabel,
  sizes,
  priority = false,
  className,
}: {
  beforeSrc: string;
  afterSrc: string;
  /** The room, said once. The two halves are labelled separately below. */
  alt: string;
  beforeLabel: string;
  afterLabel: string;
  /** What the range input announces — the halves are pictures, not options. */
  sliderLabel: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [at, setAt] = useState(50);
  const id = useId();

  return (
    <div
      className={cn(
        'group/ba relative overflow-hidden bg-sunken',
        // The ring belongs on the frame, not on an input the eye cannot find.
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-line-focus',
        className,
      )}
    >
      <Image
        src={afterSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />

      {/*
       * `clip-path` rather than a width, so the before image is never scaled.
       * Sizing the wrapper would squeeze the photograph as the divider moves
       * and the two halves would stop lining up — which is the single thing
       * this component exists to guarantee.
       */}
      <div
        aria-hidden
        className="hv-unclean absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }}
      >
        <Image src={beforeSrc} alt="" fill sizes={sizes} className="object-cover" />
      </div>

      <span
        aria-hidden
        className="absolute inset-y-0 w-0.5 bg-page/90 shadow-[0_0_12px_rgba(0,0,0,0.35)]"
        style={{ left: `${at}%` }}
      />
      <span
        aria-hidden
        className="bg-page text-ink absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.3)] transition-transform group-hover/ba:scale-110"
        style={{ left: `${at}%`, top: '50%' }}
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
          <path
            d="M8 6 4.5 10 8 14M12 6l3.5 4-3.5 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="label-type bg-inverse/85 text-ink-inverse absolute bottom-3 left-3 rounded-full px-2.5 py-1 backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="label-type bg-inverse/85 text-ink-inverse absolute right-3 bottom-3 rounded-full px-2.5 py-1 backdrop-blur-sm">
        {afterLabel}
      </span>

      <label htmlFor={id} className="sr-only">
        {sliderLabel}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={at}
        onChange={(e) => setAt(Number(e.target.value))}
        // Covers the frame so the whole picture is the control. `appearance-none`
        // hides the native track; the visible handle above is the real one.
        className="absolute inset-0 size-full cursor-ew-resize appearance-none bg-transparent opacity-0"
      />
    </div>
  );
}
