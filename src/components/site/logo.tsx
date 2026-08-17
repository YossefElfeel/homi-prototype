import { cn } from '@/lib/cn';

/**
 * The wordmark, built in code from the brand card.
 *
 * This is the one component allowed to reference brand values directly rather
 * than semantic tokens: a logo is identity, not interface. It must read the
 * same navy and the same Swiss red in all three directions — a mark that
 * changes colour with the theme is no longer a mark.
 *
 * The card's full lockup (house, swoosh, leaf, cabinet, tools) carries far too
 * much detail to survive at 28px in a header, so the mark here reduces it to
 * what actually identifies the brand: the house and the Swiss cross.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('size-8', className)}
      role="img"
      aria-hidden
      focusable="false"
    >
      <path
        d="M16 2.5 30.5 14.1V29a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V14.1Z"
        fill="var(--brand-navy-700)"
      />
      {/* Swiss cross, knocked out so it still reads at 20px. */}
      <path
        d="M14.1 10.2h3.8v3.3h3.3v3.8h-3.3v3.3h-3.8v-3.3h-3.3v-3.8h3.3z"
        fill="#fff"
      />
    </svg>
  );
}

export function Logo({
  className,
  showMark = true,
  showWordmark = true,
}: {
  className?: string;
  showMark?: boolean;
  /**
   * Dropped on the collapsed sidebar rail, where 4rem cannot hold the
   * wordmark. The mark alone still identifies the brand — that is what it was
   * reduced for — and the link that carries it takes an aria-label so the
   * destination keeps a name.
   */
  showWordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {showMark && <LogoMark className="size-7 shrink-0" />}
      {showWordmark && (
        <span className="font-display text-xl leading-none font-bold tracking-[-0.02em]">
          <span style={{ color: 'var(--brand-navy-700)' }}>HOMI</span>
          <span style={{ color: 'var(--brand-red-600)' }}>VARO</span>
        </span>
      )}
    </span>
  );
}

/** For deep-navy surfaces, where the navy half of the wordmark would vanish. */
export function LogoInverse({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" role="img" aria-hidden>
        <path
          d="M16 2.5 30.5 14.1V29a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5V14.1Z"
          fill="#fff"
        />
        <path
          d="M14.1 10.2h3.8v3.3h3.3v3.8h-3.3v3.3h-3.8v-3.3h-3.3v-3.8h3.3z"
          fill="var(--brand-red-600)"
        />
      </svg>
      <span className="font-display text-xl leading-none font-bold tracking-[-0.02em] text-white">
        HOMI
        <span style={{ color: 'var(--brand-red-500)' }}>VARO</span>
      </span>
    </span>
  );
}
