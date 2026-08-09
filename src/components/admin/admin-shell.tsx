'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bell,
  Briefcase,
  CalendarDays,
  FileText,
  History,
  Home,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  Menu,
  Percent,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Star,
  Tags,
  UserPlus,
  Users,
  UsersRound,
  X,
} from 'lucide-react';

import { Link, usePathname } from '@/i18n/navigation';
import { Logo } from '@/components/site/logo';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import { useHydrated, useStore } from '@/mock/store';

type NavKey =
  | 'dashboard'
  | 'requests'
  | 'offers'
  | 'calendar'
  | 'customers'
  | 'properties'
  | 'keys'
  | 'subscriptions'
  | 'invoices'
  | 'catalogue'
  | 'addons'
  | 'coupons'
  | 'reviews'
  | 'templates'
  | 'applications'
  | 'postings'
  | 'teamMembers'
  | 'settings'
  | 'changelog';

interface NavItem {
  href: string;
  key: NavKey;
  icon: typeof LayoutDashboard;
  /** Only /admin needs an exact match; every other item owns its subtree. */
  exact?: boolean;
}

/**
 * Grouped rather than flat.
 *
 * Sixteen items in one column is a wall: nothing is findable and the daily
 * three — requests, quotes, calendar — stop reading as the daily three. The
 * order is by frequency, not by the specification's chapter order.
 */
const NAV: {
  group: 'operations' | 'customers' | 'content' | 'hiring' | 'system';
  items: NavItem[];
}[] =
  [
    {
      group: 'operations',
      items: [
        { href: '/admin', key: 'dashboard', icon: LayoutDashboard, exact: true },
        { href: '/admin/anfragen', key: 'requests', icon: Inbox },
        { href: '/admin/offerten', key: 'offers', icon: FileText },
        { href: '/admin/kalender', key: 'calendar', icon: CalendarDays },
      ],
    },
    {
      group: 'customers',
      items: [
        { href: '/admin/kunden', key: 'customers', icon: Users },
        { href: '/admin/objekte', key: 'properties', icon: Home },
        { href: '/admin/schluessel', key: 'keys', icon: KeyRound },
        { href: '/admin/abos', key: 'subscriptions', icon: RefreshCw },
        { href: '/admin/rechnungen', key: 'invoices', icon: Receipt },
      ],
    },
    {
      group: 'content',
      items: [
        { href: '/admin/leistungen', key: 'catalogue', icon: Tags },
        { href: '/admin/zusatzleistungen', key: 'addons', icon: Sparkles },
        { href: '/admin/gutscheine', key: 'coupons', icon: Percent },
        { href: '/admin/bewertungen', key: 'reviews', icon: Star },
        { href: '/admin/vorlagen', key: 'templates', icon: Mail },
      ],
    },
    {
      group: 'hiring',
      items: [
        { href: '/admin/bewerbungen', key: 'applications', icon: UserPlus },
        { href: '/admin/stellen', key: 'postings', icon: Briefcase },
        { href: '/admin/team', key: 'teamMembers', icon: UsersRound },
      ],
    },
    {
      group: 'system',
      items: [
        { href: '/admin/einstellungen', key: 'settings', icon: Settings },
        { href: '/admin/protokoll', key: 'changelog', icon: History },
      ],
    },
  ];

/**
 * Admin chrome.
 *
 * Two things worth knowing:
 *
 *  1. It is fully responsive. The client overrode the screen-map's
 *     desktop-first decision in favour of the specification, which says the
 *     owner opens this from a phone between two jobs.
 *  2. It is gated on the owner role, and the gate is real — it reads the same
 *     role the field interface and the applicant screens read. Switching to
 *     "Mitarbeiter" in the demo bar locks this out, which is the point.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin.shell');
  const demo = useTranslations('demo.roles');
  const pathname = usePathname();
  const hydrated = useHydrated();
  const role = useStore((s) => s.demo.role);
  const requests = useStore((s) => s.data.requests);
  const [open, setOpen] = useState(false);

  const waiting = hydrated
    ? requests.filter((r) => r.status === 'new' || r.status === 'inReview').length
    : 0;

  if (hydrated && role !== 'owner') {
    return (
      <main id="main" className="mx-auto max-w-2xl px-gutter py-section">
        <EmptyState
          icon={Lock}
          title={t('gateTitle')}
          body={`${t('gateBody')} ${t('gateCurrent', { role: demo(role) })}`}
        />
      </main>
    );
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const navList = (onNavigate?: () => void) => (
    <div className="space-y-6">
      {NAV.map((section, index) => (
        <div key={section.group}>
          {index > 0 && (
            <p className="label-type mb-2 px-3 text-ink-tertiary">
              {t(`groups.${section.group}`)}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-accent-subtle font-medium text-ink'
                        : 'text-ink-secondary hover:bg-sunken hover:text-ink',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1">{t(`nav.${item.key}`)}</span>
                    {item.key === 'requests' && waiting > 0 && (
                      <span
                        data-numeric
                        className="rounded-full bg-accent px-1.5 py-0.5 text-[0.6875rem] font-medium text-on-accent"
                      >
                        {waiting}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-line-subtle bg-sunken lg:block">
        <div className="sticky top-0 flex h-dvh flex-col p-5">
          <Link href="/" className="mb-8">
            <Logo />
          </Link>
          <nav aria-label={t('title')} className="flex-1">
            {navList()}
          </nav>
          <p className="border-t border-line-subtle pt-4 text-sm text-ink-tertiary">
            Marco Brunner
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line-subtle bg-page/95 px-gutter backdrop-blur-sm lg:justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t('menu')}
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Link href="/admin" className="lg:hidden">
            <Logo showMark={false} />
          </Link>
          <Link
            href="/admin/suche"
            aria-label={t('search')}
            className="ms-auto inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken lg:ms-0"
          >
            <Search className="size-5" aria-hidden />
          </Link>
          <button
            type="button"
            aria-label={t('notifications')}
            className="relative inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken"
          >
            <Bell className="size-5" aria-hidden />
            {waiting > 0 && (
              <span
                aria-hidden
                className="absolute top-2.5 right-2.5 size-2 rounded-full bg-rule"
              />
            )}
          </button>
        </header>

        <main id="main" className="px-gutter py-8">
          {children}
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-page lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-line-subtle px-gutter">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('menu')}
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-sunken"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label={t('title')} className="px-gutter py-5">
            {navList(() => setOpen(false))}
          </nav>
        </div>
      )}
    </div>
  );
}
