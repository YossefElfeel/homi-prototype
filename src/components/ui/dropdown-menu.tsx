'use client';

import * as MenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

/**
 * Row actions and the user menu.
 *
 * Two things this fixes beyond looks: the shell had no sign-out control at all
 * despite the message keys existing in every locale, and admin list rows
 * carried every action inline, which is what pushed those tables past the
 * viewport on anything narrower than a laptop.
 */
export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = 'end',
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        data-hv="pop"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-52 overflow-hidden rounded-[var(--radius-md)] border border-line-subtle bg-card p-1 shadow-[var(--shadow-lg)]',
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

const itemBase = [
  'relative flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm',
  'transition-colors duration-[var(--motion-fast)] outline-none select-none',
  'focus:bg-sunken data-[highlighted]:bg-sunken',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
  '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-tertiary',
];

export function DropdownMenuItem({
  className,
  tone = 'default',
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  tone?: 'default' | 'danger';
}) {
  return (
    <MenuPrimitive.Item
      className={cn(
        itemBase,
        tone === 'danger' &&
          'text-status-danger-fg focus:bg-status-danger data-[highlighted]:bg-status-danger [&_svg]:text-status-danger-fg',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem
      className={cn(itemBase, 'pr-8', className)}
      {...props}
    >
      {children}
      <MenuPrimitive.ItemIndicator className="absolute right-2.5">
        <Check className="size-4 text-ink-accent" aria-hidden />
      </MenuPrimitive.ItemIndicator>
    </MenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.RadioGroup>) {
  return <MenuPrimitive.RadioGroup {...props} />;
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem className={cn(itemBase, 'pr-8', className)} {...props}>
      {children}
      <MenuPrimitive.ItemIndicator className="absolute right-2.5">
        <Check className="size-4 text-ink-accent" aria-hidden />
      </MenuPrimitive.ItemIndicator>
    </MenuPrimitive.RadioItem>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Label>) {
  return (
    <MenuPrimitive.Label
      className={cn('px-2.5 py-1.5 text-2xs font-medium text-ink-tertiary', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      className={cn('-mx-1 my-1 h-px bg-line-subtle', className)}
      {...props}
    />
  );
}
