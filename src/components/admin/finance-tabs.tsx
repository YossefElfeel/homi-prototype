'use client';

import { useTranslations } from 'next-intl';
import { BarChart3, Receipt, Wallet } from 'lucide-react';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

/**
 * The three screens of the money section, as one strip.
 *
 * They are routes, not tabs, and that is the whole reason this is hand-built
 * rather than `<Tabs>` from the design system. Radix Tabs swaps panels inside
 * one page: everything below it would share a URL, so «zeig mir die Ausgaben»
 * could not be sent to anybody, the browser's back button would leave the
 * section instead of the view, and three lists with three sets of filters
 * would be holding their state in one component. The invoice list already
 * carries a search, a status filter and a page number in it.
 *
 * So: links that look exactly like tabs. The classes are lifted from
 * `TabsList`/`TabsTrigger` deliberately — the strip has to be the same object
 * the reader already knows from /admin/kunden, or it reads as a third kind of
 * navigation. What changes is the semantics underneath: a `<nav>` of links with
 * `aria-current="page"`, which is what a screen reader needs to hear for
 * something that moves you rather than something that shows you.
 *
 * The sidebar entry above it says «Finanzen» and lands on the first of the
 * three. That is the same relationship /admin/kunden has with its own tabs —
 * one door, and the strip inside says which room.
 */
const TABS = [
  { key: 'invoices', href: '/admin/rechnungen', icon: Receipt },
  { key: 'expenses', href: '/admin/ausgaben', icon: Wallet },
  { key: 'analytics', href: '/admin/finanzen', icon: BarChart3 },
] as const;

export function FinanceTabs({ className }: { className?: string }) {
  const t = useTranslations('admin.finance.tabs');
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('label')}
      className={cn('mb-app -mx-1 overflow-x-auto px-1', className)}
    >
      <ul className="inline-flex max-w-full items-center gap-1 rounded-[var(--radius-md)] bg-sunken p-1">
        {TABS.map((tab) => {
          /* The detail screens belong to their list's tab — an expense opened
             from /admin/ausgaben must not drop the strip's highlight, or the
             reader loses the section on the way into a record. Prefix rather
             than equality for that reason, and the invoice tab is the one that
             has to be careful: `/admin/rechnungen` is not a prefix of the other
             two, so there is no overlap to guard against. */
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium whitespace-nowrap',
                  'transition-colors duration-[var(--motion-fast)]',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
                  active
                    ? 'bg-card text-ink shadow-[var(--shadow-sm)]'
                    : 'text-ink-secondary hover:text-ink',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {t(tab.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
