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
        'inline-flex items-center gap-1.5 rounded-sm border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[0.6875rem]' : 'px-2 py-1 text-xs',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {t(state)}
    </span>
  );
}
