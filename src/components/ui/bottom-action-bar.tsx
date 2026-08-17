import { cn } from '@/lib/cn';

/**
 * The thumb-reachable bar at the bottom of a phone screen.
 *
 * Six near-identical copies of this existed — in the quote builder, the
 * booking wizard, the floating site actions, and all three field screens —
 * each re-deriving the same safe-area padding expression. When one of them
 * needed fixing, five stayed broken.
 *
 * `env(safe-area-inset-bottom)` is the part that matters: without it the
 * primary action sits under the iPhone home indicator, which is exactly where
 * the field app is used.
 */
export function BottomActionBar({
  className,
  children,
  /** `mobile` hides it from lg up, where the action lives in the page. */
  visibility = 'mobile',
  above,
}: {
  className?: string;
  children: React.ReactNode;
  visibility?: 'mobile' | 'always';
  /** An expandable summary or a warning, shown above the actions. */
  above?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-line-subtle bg-page/95 backdrop-blur-sm',
        visibility === 'mobile' && 'lg:hidden',
        className,
      )}
    >
      {above}
      <div className="flex items-center gap-3 px-gutter pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}

/**
 * Reserves the height the fixed bar covers. Without this the last row of a
 * list sits permanently underneath it and cannot be scrolled into view.
 */
export function BottomActionBarSpacer({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'h-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden',
        className,
      )}
    />
  );
}
