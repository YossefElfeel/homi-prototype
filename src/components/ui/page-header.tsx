import { ArrowLeft, ChevronRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export type Crumb = { label: string; href?: string };

/**
 * Every dashboard screen opens the same way, so it stops being retyped.
 *
 * `display-type text-3xl` appeared 57 times across 52 files before this, and
 * the account area had drifted onto a different heading convention from admin.
 * One component means one answer to "where does the back link go", "where do
 * the actions sit", and "what happens to both at 375px".
 */
export function PageHeader({
  title,
  lead,
  back,
  crumbs,
  meta,
  actions,
  className,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Explicit back link. Detail screens should always carry one. */
  back?: { href: string; label: string };
  crumbs?: Crumb[];
  /** Status badges, reference numbers — anything that qualifies the title. */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-app-section', className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-tertiary">
            {crumbs.map((crumb, i) => (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="rounded-[var(--radius-xs)] transition-colors hover:text-ink"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-ink-secondary">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-secondary transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="display-type text-2xl sm:text-3xl">{title}</h1>
            {meta}
          </div>
          {lead && (
            <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{lead}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}

/**
 * Section heading inside a page. Sits a level below PageHeader and above a
 * Card, for screens that group several blocks under one title.
 */
export function SectionHeader({
  title,
  description,
  actions,
  className,
  headingLevel = 2,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <div
      className={cn(
        'mb-app flex flex-wrap items-end justify-between gap-x-4 gap-y-2',
        className,
      )}
    >
      <div className="min-w-0">
        <Heading className="display-type text-lg">{title}</Heading>
        {description && (
          <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
