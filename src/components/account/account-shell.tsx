'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  CreditCard,
  FileText,
  Home,
  Images,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  RefreshCw,
  Star,
  Timer,
  User,
} from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { AccessGate } from '@/components/app/access-gate';
import { effectiveInvoiceStatus } from '@/lib/invoice-permissions';
import { AppShell, type AppNavGroup } from '@/components/app/app-shell';
import { Button } from '@/components/ui/button';
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

/**
 * Ordered by how often a customer actually opens each one, not by the
 * specification's chapter order. Appointments and money sit at the top; the
 * plan, credit and payment details are visited a handful of times a year.
 */
const NAV: {
  group: 'jobs' | 'account';
  items: { href: string; key: NavKey; icon: typeof LayoutDashboard; exact?: boolean }[];
}[] = [
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
 * This used to render inside the marketing header and footer, with an
 * invisible sidebar — no background, no border, no group labels — floating in
 * the page. It was the single biggest reason the customer area never read as
 * an application: every screen was framed as a page on a website.
 *
 * It now uses the same AppShell as the admin console. The way back to the
 * public site is explicit instead of ambient: a link in the sidebar footer and
 * one in the account menu, so nothing is lost by dropping the site header.
 */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('account.shell');
  const appT = useTranslations('app');
  const demoRoles = useTranslations('demo.roles');
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const role = useStore((s) => s.demo.role);
  const setRole = useStore((s) => s.setRole);
  const customerId = useStore((s) => s.demo.currentCustomerId);
  const customers = useStore((s) => s.data.customers);
  const messages = useStore((s) => s.data.messages);
  const invoices = useStore((s) => s.data.invoices);

  /*
   * A blocked customer is blocked from their own account too, or the block
   * is only a note the office keeps: the person can still sign in, read
   * their history and reply in the message thread. Same gate as the wrong
   * role, one screen earlier than any of it renders.
   */
  const self = customers.find((c) => c.id === customerId);
  if (hydrated && role === 'customer' && self?.status === 'blocked') {
    return (
      <AccessGate
        title={t('blockedTitle')}
        body={t('blockedBody')}
        action={
          <Button asChild variant="secondary">
            <Link href="/">{appT('backToSite')}</Link>
          </Button>
        }
      />
    );
  }

  if (hydrated && role !== 'customer') {
    return (
      <AccessGate
        title={t('gateTitle')}
        body={`${t('gateBody')} ${t('gateCurrent', { role: demoRoles(role) })}`}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/anmelden">{t('gateAction')}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">{appT('backToSite')}</Link>
            </Button>
          </div>
        }
      />
    );
  }

  const unreadMessages = hydrated
    ? messages.filter(
        (m) => m.customerId === customerId && m.from === 'homivaro' && !m.readByCustomer,
      )
    : [];

  const dueInvoices = hydrated
    ? invoices.filter(
        (i) =>
          i.customerId === customerId &&
          /* Was this expression written out inline, one of three copies of it
             across the app. One of the three had drifted: the admin list
             derived «überfällig» for a column while the badge beside it still
             read the stored status. */
          effectiveInvoiceStatus(i, now) === 'overdue',
      )
    : [];

  const badgeFor = (key: NavKey) =>
    key === 'messages'
      ? unreadMessages.length
      : key === 'invoices'
        ? dueInvoices.length
        : undefined;

  const nav: AppNavGroup[] = NAV.map((section, index) => ({
    key: section.group,
    /* The account sidebar had no group labels at all — two blocks split by an
       <hr>, which says "these are different" without saying how. */
    label: index === 0 ? undefined : t(`groups.${section.group}`),
    items: section.items.map((item) => ({
      href: item.href,
      label: t(`nav.${item.key}`),
      icon: item.icon,
      exact: item.exact,
      badge: badgeFor(item.key),
    })),
  }));

  const customer = customers.find((c) => c.id === customerId);
  const userName = customer ? `${customer.firstName} ${customer.lastName}` : t('title');

  function signOut() {
    setRole('visitor');
    toast.success(appT('signOutConfirm'));
    router.push('/');
  }

  return (
    <AppShell
      nav={nav}
      navLabel={t('title')}
      homeHref="/konto"
      user={{ name: userName, role: demoRoles('customer') }}
      onSignOut={signOut}
      notifications={[
        ...unreadMessages.slice(0, 3).map((m) => ({
          id: m.id,
          title: m.subject,
          detail: m.body.slice(0, 60),
          href: '/konto/nachrichten',
        })),
        ...dueInvoices.slice(0, 3).map((i) => ({
          id: i.id,
          title: i.reference,
          href: `/konto/rechnungen/${i.id}`,
        })),
      ]}
      notificationsHref="/konto"
    >
      {children}
    </AppShell>
  );
}
