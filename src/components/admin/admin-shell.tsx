'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Briefcase,
  CalendarDays,
  FileText,
  History,
  Home,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Mail,
  Percent,
  Receipt,
  RefreshCw,
  Settings,
  Sparkles,
  Star,
  Tags,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { AccessGate } from '@/components/app/access-gate';
import { AppShell, type AppNavGroup } from '@/components/app/app-shell';
import { Button } from '@/components/ui/button';
import type { CommandGroup } from '@/components/ui/command-palette';
import { SEARCH_GROUPS, searchAll, type SearchGroup } from '@/lib/admin-search';
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
  | 'messages'
  | 'applications'
  | 'postings'
  | 'teamMembers'
  | 'settings'
  | 'changelog';

/**
 * Grouped rather than flat.
 *
 * Twenty items in one column is a wall: nothing is findable and the daily
 * three — requests, quotes, calendar — stop reading as the daily three. The
 * order is by frequency, not by the specification's chapter order, and the two
 * groups an owner opens least start folded.
 */
const NAV: {
  group: 'operations' | 'customers' | 'content' | 'hiring' | 'system';
  collapsed?: boolean;
  items: { href: string; key: NavKey; icon: typeof LayoutDashboard; exact?: boolean }[];
}[] = [
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
      { href: '/admin/nachrichten', key: 'messages', icon: Mail },
      { href: '/admin/objekte', key: 'properties', icon: Home },
      { href: '/admin/schluessel', key: 'keys', icon: KeyRound },
      { href: '/admin/abos', key: 'subscriptions', icon: RefreshCw },
      { href: '/admin/rechnungen', key: 'invoices', icon: Receipt },
    ],
  },
  {
    group: 'content',
    collapsed: true,
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
    collapsed: true,
    items: [
      { href: '/admin/bewerbungen', key: 'applications', icon: UserPlus },
      { href: '/admin/stellen', key: 'postings', icon: Briefcase },
      { href: '/admin/team', key: 'teamMembers', icon: UsersRound },
    ],
  },
  {
    group: 'system',
    collapsed: true,
    items: [
      { href: '/admin/einstellungen', key: 'settings', icon: Settings },
      { href: '/admin/protokoll', key: 'changelog', icon: History },
    ],
  },
];

const GROUP_LABEL_KEY: Record<SearchGroup, string> = {
  Customers: 'searchGroupCustomers',
  Requests: 'searchGroupRequests',
  Offers: 'searchGroupOffers',
  Invoices: 'searchGroupInvoices',
  Properties: 'searchGroupProperties',
};

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
 *
 * Everything below the gate is now AppShell, shared with the customer area.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin.shell');
  const appT = useTranslations('app');
  const demoRoles = useTranslations('demo.roles');
  const router = useRouter();
  const hydrated = useHydrated();

  const role = useStore((s) => s.demo.role);
  const setRole = useStore((s) => s.setRole);
  const data = useStore((s) => s.data);
  const memberId = useStore((s) => s.demo.currentMemberId);

  const search = useCallback(
    (query: string): CommandGroup[] => {
      const hits = searchAll(data, query);
      return SEARCH_GROUPS.map((group) => ({
        key: group,
        label: appT(GROUP_LABEL_KEY[group]),
        items: hits
          .filter((hit) => hit.group === group)
          .slice(0, 5)
          .map((hit) => ({
            id: `${hit.group}-${hit.id}`,
            label: hit.title,
            detail: hit.detail,
            href: hit.href,
            onSelect: () => router.push(hit.href),
          })),
      })).filter((group) => group.items.length > 0);
    },
    [data, appT, router],
  );

  if (hydrated && role !== 'owner') {
    return (
      <AccessGate
        title={t('gateTitle')}
        body={`${t('gateBody')} ${t('gateCurrent', { role: demoRoles(role) })}`}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/admin/anmelden">{t('gateSignIn')}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">{t('gateHome')}</Link>
            </Button>
          </div>
        }
      />
    );
  }

  const waitingRequests = hydrated
    ? data.requests.filter((r) => r.status === 'new' || r.status === 'inReview')
    : [];

  /* The sidebar footer used to print "Marco Brunner" as a literal, so the
     scenario's own team data and the name on screen could disagree. The field
     shell already read it from the store; this now does the same. */
  const member = data.team.find((m) => m.id === memberId);
  const userName = member ? `${member.firstName} ${member.lastName}` : t('title');

  const nav: AppNavGroup[] = NAV.map((section, index) => ({
    key: section.group,
    label: index === 0 ? undefined : t(`groups.${section.group}`),
    defaultCollapsed: section.collapsed,
    items: section.items.map((item) => ({
      href: item.href,
      label: t(`nav.${item.key}`),
      icon: item.icon,
      exact: item.exact,
      badge: item.key === 'requests' ? waitingRequests.length : undefined,
    })),
  }));

  function signOut() {
    setRole('visitor');
    toast.success(appT('signOutConfirm'));
    router.push('/');
  }

  return (
    <AppShell
      nav={nav}
      navLabel={t('title')}
      homeHref="/admin"
      user={{ name: userName, role: demoRoles('owner') }}
      onSignOut={signOut}
      notifications={waitingRequests.slice(0, 6).map((request) => ({
        id: request.id,
        title: request.reference,
        detail: customerLabel(data, request.customerId),
        href: `/admin/anfragen/${request.id}`,
      }))}
      notificationsHref="/admin/anfragen"
      search={search}
    >
      {children}
    </AppShell>
  );
}

function customerLabel(data: { customers: { id: string; firstName: string; lastName: string }[] }, id: string) {
  const customer = data.customers.find((c) => c.id === id);
  return customer ? `${customer.firstName} ${customer.lastName}` : '—';
}
