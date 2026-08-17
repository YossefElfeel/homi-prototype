import {
  AlertTriangle,
  CheckCircle2,
  Info,
  OctagonAlert,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * The callout that was being retyped inline on every screen that needed to
 * warn about something — a travel conflict on the calendar, a plan inside its
 * minimum term, the key log locked until liability insurance is on.
 *
 * Tones come from the status registry's palette, which is deliberately the one
 * part of the token system that does NOT change per theme: "الحالة الواحدة
 * ملهاش لونين في مكانين". A warning is the same amber everywhere.
 */
const TONE = {
  info: {
    box: 'border-status-info-line bg-status-info text-status-info-fg',
    icon: Info,
  },
  success: {
    box: 'border-status-success-line bg-status-success text-status-success-fg',
    icon: CheckCircle2,
  },
  warning: {
    box: 'border-status-warning-line bg-status-warning text-status-warning-fg',
    icon: AlertTriangle,
  },
  danger: {
    box: 'border-status-danger-line bg-status-danger text-status-danger-fg',
    icon: OctagonAlert,
  },
  neutral: {
    box: 'border-status-neutral-line bg-status-neutral text-status-neutral-fg',
    icon: Info,
  },
} as const;

export function Alert({
  tone = 'info',
  title,
  icon,
  action,
  className,
  children,
}: {
  tone?: keyof typeof TONE;
  title?: React.ReactNode;
  /** Override the tone's default glyph when a more specific one exists. */
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  const { box, icon: DefaultIcon } = TONE[tone];
  const Icon = icon ?? DefaultIcon;
  /* Warnings and errors need to reach a screen reader the moment they render;
     an informational note should not interrupt what is being read. */
  const assertive = tone === 'danger' || tone === 'warning';

  return (
    <div
      role={assertive ? 'alert' : 'note'}
      className={cn(
        'flex gap-3 rounded-[var(--radius-md)] border p-4 text-sm',
        box,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && 'mt-1')}>{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}
