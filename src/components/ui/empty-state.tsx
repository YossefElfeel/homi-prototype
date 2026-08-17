import { Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The empty-state contract from the brief, in one component:
 *
 *   "أي قايمة أو جدول لازم له حالة فاضية فيها: أيقونة أو رسم بسيط، جملة بتقول
 *    إيه اللي ناقص، وزرار بيوصّل لأقرب إجراء مفيد. مش صفحة بيضا مكتوب عليها
 *    لا يوجد بيانات."
 *
 * The body is required, not optional — an empty state that does not explain
 * *why* it is empty is the failure mode this exists to prevent.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  action,
  className,
  compact = false,
  headingLevel = 3,
}: {
  icon?: typeof Inbox;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
  /**
   * h3 under a section heading, h2 directly under a page title, h1 when the
   * empty state *is* the page — a role gate or a link that no longer
   * resolves. Getting this wrong skips a level, which is exactly what a
   * screen reader navigating by heading trips over.
   */
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = headingLevel === 1 ? 'h1' : headingLevel === 2 ? 'h2' : 'h3';

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-line text-center',
        compact ? 'px-6 py-10' : 'px-6 py-16',
        className,
      )}
    >
      {/* The bare glyph read as a rendering artefact at this size. Seating it
          in a tinted well makes it read as an illustration. */}
      <span className="flex size-12 items-center justify-center rounded-full bg-sunken">
        <Icon className="size-5 text-ink-tertiary" aria-hidden />
      </span>
      <Heading className="mt-4 text-lg font-medium">{title}</Heading>
      <p className="mt-2 max-w-[46ch] text-ink-secondary">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
