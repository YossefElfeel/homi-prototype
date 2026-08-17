import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { statusTone, TONE_CLASSES, type StatusEntity } from '@/lib/status-registry';

/**
 * The only way a state is ever rendered. Colour and label both come from
 * lib/status-registry.ts, so a state looks and reads the same on the admin
 * table, the customer dashboard and the field screen.
 */
export function StatusBadge({
  entity,
  state,
  size = 'md',
  className,
}: {
  entity: StatusEntity;
  state: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const t = useTranslations(`status.${entity}`);
  const tone = statusTone(entity, state);

  return (
    <span
      className={cn(
        /* Was `rounded-sm` — Tailwind's own 2px, not the theme axis. So the
           badge stayed square in Zuhause, which rounds everything else to
           10px, and it was the one element in the kit that ignored the token
           system entirely. */
        'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {t(state)}
    </span>
  );
}
