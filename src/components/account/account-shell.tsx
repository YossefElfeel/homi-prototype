'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  FileText,
  Home,
  Images,
  LayoutDashboard,
  Lock,
  Menu,
  MessageSquare,
  Receipt,
  Star,
  RefreshCw,
  Timer,
  User,
  X,
} from 'lucide-react';

import { Link, usePathname } from '@/i18n/navigation';
import { Logo } from '@/components/site/logo';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import { useHydrated, useNow, useStore } from '@/mock/store';

type NavKey =
  | 'dashboard'
  | 'requests'
  | 'offers'
  | 'invoices'
  | 'properties'
  | 'subscription'
  | 'credit'
  | 'payment'
  | 'photos'
  | 'review'
  | 'messages'
  | 'profile';

interface NavItem {
  href: string;
  key: NavKey;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

/**
 * Ordered by how often a customer actually opens each one, not by the
 * specification's chapter order. Appointments and money sit at the top; the
 * plan, credit and payment details are visited a handful of times a year.
 */
const NAV: { group: 'jobs' | 'account'; items: NavItem[] }[] = [
  {
    group: 'jobs',
    items: [
      { href: '/konto', key: 'dashboard', icon: LayoutDashboard, exact: true },
      { href: '/konto/anfragen', key: 'requests', icon: FileText },
      { href: '/konto/offerten', key: 'offers', icon: FileText },
      { href: '/konto/rechnungen', key: 'invoices', icon: Receipt },
      { href: '/konto/nachrichten', key: 'messages', icon: MessageSquare },
      { href: '/konto/fotos', key: 'photos', icon: Images },
      { href: '/konto/bewertung', key: 'review', icon: Star },
    ],
  },
  {
    group: 'account',
    items: [
      { href: '/konto/objekte', key: 'properties', icon: Home },
      { href: '/konto/abo', key: 'subscription', icon: RefreshCw },
      { href: '/konto/guthaben', key: 'credit', icon: Timer },
      { href: '/konto/zahlungsmittel', key: 'payment', icon: CreditCard },
      { href: '/konto/profil', key: 'profile', icon: User },
    ],
  },
];

/**
 * Customer account chrome.
 *
 * Gated on the customer role, and — unlike the admin shell — it keeps the
 * public header above it. A customer who lands here from a booking email is
 * still browsing the same site, and hiding the way back to the services is how
 * an account area turns into a dead end.
 */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('account.shell');
  const demoRoles = useTranslations('demo.roles');
  const pathname = usePathname();
  const hydrated = useHydrated();
  const now = useNow();

  const role = useStore((s) => s.demo.role);
  const customerId = useStore((s) => s.demo.currentCustomerId);
  const messages = useStore((s) => s.data.messages);
  const invoices = useStore((s) => s.data.invoices);
  const [open, setOpen] = useState(false);

  const unread = hydrated
    ? messages.filter(
        (m) => m.customerId === customerId && m.from === 'homivaro' && !m.readByCustomer,
      ).length
    : 0;

  const dueInvoices = hydrated
    ? invoices.filter(
        (i) =>
          i.customerId === customerId &&
          (i.status === 'overdue' || (i.status === 'sent' && new Date(i.dueAt) < now)),
      ).length
    : 0;

  if (hydrated && role !== 'customer') {
    return (
      <div className="py-section">
        <EmptyState
          icon={Lock}
          headingLevel={1}
          title={t('gateTitle')}
          body={`${t('gateBody')} ${t('gateCurrent', { role: demoRoles(role) })}`}
          action={
            <Button asChild>
              <Link href="/anmelden">{t('gateAction')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const badgeFor = (key: NavKey) =>
    key === 'messages' ? unread : key === 'invoices' ? dueInvoices : 0;

  const navList = (onNavigate?: () => void) => (
    <div className="space-y-6">
      {NAV.map((section, index) => (
        <div key={section.group}>
          {index > 0 && <hr className="mb-4 border-line-subtle" />}
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              const badge = badgeFor(item.key);
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
                    {badge > 0 && (
                      <span
                        data-numeric
                        className="rounded-full bg-accent px-1.5 py-0.5 text-[0.6875rem] font-medium text-on-accent"
                      >
                        {badge}
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
    <div className="py-10 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-12">
      <aside className="hidden lg:block">
        <nav aria-label={t('title')} className="sticky top-24">
          {navList()}
        </nav>
      </aside>

      <div className="min-w-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-line px-3 text-sm transition-colors hover:bg-sunken lg:hidden"
        >
          <Menu className="size-4" aria-hidden />
          {t('title')}
          {unread + dueInvoices > 0 && (
            <span
              data-numeric
              className="rounded-full bg-accent px-1.5 py-0.5 text-[0.6875rem] font-medium text-on-accent"
            >
              {unread + dueInvoices}
            </span>
          )}
        </button>

        {children}
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
