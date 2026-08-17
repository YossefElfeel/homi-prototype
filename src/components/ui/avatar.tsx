'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/cn';

/**
 * There are no photographs of staff in this prototype and there will not be
 * before launch, so the fallback *is* the component: initials on a tinted
 * well. Radix still handles the image path for the day real photos exist.
 */
const SIZE = {
  sm: 'size-7 text-2xs',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
} as const;

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-full',
        SIZE[size],
        className,
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          className="size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        delayMs={src ? 300 : 0}
        className="flex size-full items-center justify-center bg-accent-quiet font-medium text-ink-accent"
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/** First and last initial. "Marco Brunner" → MB, "Marco" → M. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
