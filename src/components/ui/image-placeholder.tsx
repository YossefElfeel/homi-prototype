import { cn } from '@/lib/cn';

/**
 * Stand-in for photography that does not exist yet.
 *
 * TODO:asset — every instance is replaced by a real photograph before launch.
 *
 * Deliberately a composed geometric field rather than a grey box with a broken
 * icon: a client should read "the picture goes here", not "the site is
 * broken". The composition is derived from the seed so two placeholders on the
 * same page never look identical, and it picks up the theme's own tokens so it
 * belongs to whichever direction is active.
 */
function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function ImagePlaceholder({
  seed,
  alt,
  className,
  tone = 'light',
}: {
  seed: string;
  alt: string;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const h = hash(seed);
  const a = 20 + (h % 30);
  const b = 55 + ((h >> 3) % 25);
  const c = 30 + ((h >> 6) % 40);
  const rot = -12 + ((h >> 9) % 24);

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'relative overflow-hidden',
        tone === 'dark' ? 'bg-[var(--brand-navy-800)]' : 'bg-accent-subtle',
        className,
      )}
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`g-${h}`} x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0"
              stopColor={tone === 'dark' ? 'var(--brand-navy-600)' : 'var(--brand-navy-700)'}
              stopOpacity={tone === 'dark' ? 0.55 : 0.14}
            />
            <stop
              offset="1"
              stopColor={tone === 'dark' ? 'var(--brand-navy-900)' : 'var(--brand-navy-600)'}
              stopOpacity={tone === 'dark' ? 0.9 : 0.04}
            />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#g-${h})`} />
        <g transform={`rotate(${rot} 200 150)`}>
          <rect
            x={a * 2}
            y={c}
            width={b * 3}
            height={b * 2}
            fill="var(--brand-navy-700)"
            opacity={tone === 'dark' ? 0.28 : 0.07}
          />
          <circle
            cx={330 - a}
            cy={70 + c}
            r={40 + (h % 25)}
            fill="var(--brand-green-600)"
            opacity={tone === 'dark' ? 0.22 : 0.1}
          />
          <rect
            x={a}
            y={200 - c / 2}
            width="140"
            height="4"
            fill="var(--brand-red-600)"
            opacity={0.55}
          />
        </g>
      </svg>
    </div>
  );
}
