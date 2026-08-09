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
}: {
  icon?: typeof Inbox;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center border border-dashed border-line text-center',
        compact ? 'px-6 py-10' : 'px-6 py-16',
        className,
      )}
    >
      <Icon className="size-7 text-ink-tertiary" aria-hidden />
      <h3 className="mt-5 text-lg font-medium">{title}</h3>
      <p className="mt-2 max-w-[46ch] text-ink-secondary">{body}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}
