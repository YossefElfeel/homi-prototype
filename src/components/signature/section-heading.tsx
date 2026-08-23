import { cn } from '@/lib/cn';

import type { Theme } from '@/lib/theme';

/**
 * SIGNATURE COMPONENT — the rhythm that sets each direction's voice.
 *
 * Raster anchors sections hard left with a red rule. Zuhause keeps them left
 * but softer and closer. Goldküste centres them with wide letterspacing and a
 * hairline above — the section break itself becomes the ornament.
 */
export function SectionHeading({
  theme,
  eyebrow,
  title,
  lead,
  align,
  level = 2,
  className,
}: {
  theme: Theme;
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: 'start' | 'center';
  /**
   * Every page needs exactly one h1. Pages whose first section *is* the page
   * title pass level={1}; everything else stays at h2 so the outline never
   * skips a level. Defaulting to 2 was how seven pages ended up shipping
   * without an h1 at all.
   */
  level?: 1 | 2;
  className?: string;
}) {
  const centred = align === 'center' || (align === undefined && theme === 'goldkueste');
  const Title = level === 1 ? 'h1' : 'h2';
  const size =
    level === 1
      ? 'text-[clamp(2rem,4.5vw,3.5rem)]'
      : 'text-[clamp(1.75rem,3.4vw,2.75rem)]';

  const leadNode = lead && (
    <p
      className={cn(
        'max-w-[var(--measure)] text-lg text-ink-secondary',
        theme === 'zuhause' ? 'mt-4' : 'mt-5',
        centred && 'mx-auto',
      )}
    >
      {lead}
    </p>
  );

  if (theme === 'homivaro') {
    /*
     * No rule under the heading — at this scale, in caps, the type is the
     * rule. The sizes are the point of this branch: Bebas is caps-only and
     * condensed, and this direction does not set it below 36px anywhere, so
     * the shared clamps (which bottom out at 28px) would put every interior
     * page under the floor on a narrow screen.
     *
     * Section headings here are the restrained scale, not the homepage's
     * 82px. A page that is mostly a table or a form should not open every
     * block at poster size — the sections that earn that are composed for it,
     * and they use <Headline> directly.
     */
    return (
      <header className={cn(centred ? 'text-center' : '', className)}>
        {eyebrow && <p className="label-type text-ink-tertiary">{eyebrow}</p>}
        <Title
          className={cn(
            'display-type mt-4',
            level === 1
              ? 'text-[clamp(38px,6vw,88px)] leading-[0.92]'
              : 'text-[clamp(36px,4.4vw,62px)] leading-[0.95]',
          )}
        >
          {title}
        </Title>
        {leadNode}
      </header>
    );
  }

  if (theme === 'goldkueste') {
    return (
      <header className={cn(centred ? 'text-center' : '', className)}>
        <span aria-hidden className={cn('block h-px w-14 bg-rule', centred && 'mx-auto')} />
        {eyebrow && <p className="label-type mt-6 text-ink-tertiary">{eyebrow}</p>}
        <Title className={cn('display-type mt-4', size)}>{title}</Title>
        {leadNode}
      </header>
    );
  }

  if (theme === 'zuhause') {
    return (
      <header className={cn(centred ? 'text-center' : '', className)}>
        {eyebrow && <p className="label-type text-ink-tertiary">{eyebrow}</p>}
        <Title className={cn('display-type mt-2', size)}>{title}</Title>
        {leadNode}
      </header>
    );
  }

  return (
    <header className={cn(centred ? 'text-center' : '', className)}>
      {eyebrow && <p className="label-type text-ink-tertiary">{eyebrow}</p>}
      <Title className={cn('display-type mt-3', size)}>{title}</Title>
      <span
        aria-hidden
        className={cn('mt-5 block h-0.5 w-12 bg-rule', centred && 'mx-auto')}
      />
      {leadNode}
    </header>
  );
}

/** Every marketing section uses this so vertical rhythm comes from the theme. */
export function Section({
  children,
  className,
  tone = 'page',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'page' | 'sunken' | 'inverse';
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'py-section',
        tone === 'sunken' && 'bg-sunken',
        tone === 'inverse' && 'bg-inverse text-ink-inverse',
        className,
      )}
    >
      {/* hv-section-inner is a hook, not a style: Homivaro's container is
          1440 to match its header, and every other direction keeps 7xl. The
          gutter already comes from --space-gutter, so only the ceiling moves. */}
      <div className="hv-section-inner mx-auto max-w-7xl px-gutter">{children}</div>
    </section>
  );
}
