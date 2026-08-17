import { cn } from '@/lib/cn';

/**
 * Every hydration-gated screen in this prototype used to render a bare
 * `<p className="text-ink-tertiary">…</p>` while the persisted store came
 * back. One ellipsis, no shape, and the layout jumped the moment data
 * arrived — the exact content shift the layout rules exist to prevent.
 *
 * These reserve the real shape instead. The global prefers-reduced-motion
 * rule already flattens the pulse, so there is nothing extra to guard.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-[var(--radius-sm)] bg-sunken', className)}
      {...props}
    />
  );
}

/** Rows for a DataView that is still waiting on the store. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-row-h w-full" />
      ))}
    </div>
  );
}

/**
 * The default page-level placeholder: a title bar and a card-sized block.
 * `label` is announced to screen readers, which the old ellipsis never was.
 */
export function SkeletonPage({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-app', className)} role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="gap-app grid grid-cols-2 pt-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <SkeletonRows rows={4} className="pt-2" />
    </div>
  );
}
