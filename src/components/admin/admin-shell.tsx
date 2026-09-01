'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  BarChart3,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  FileText,
  History,
  Home,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  Percent,
  Receipt,
  RefreshCw,
  Settings,
  ShieldUser,
  Sparkles,
  Star,
  Tags,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { AccessGate } from '@/components/app/access-gate';
import { AppShell, type AppNavGroup } from '@/components/app/app-shell';
import { Button } from '@/components/ui/button';
import type { CommandGroup } from '@/components/ui/command-palette';
import { EmptyState } from '@/components/ui/empty-state';
import { SEARCH_GROUPS, searchAll, type SearchGroup } from '@/lib/admin-search';
import {
  AREAS,
  PERMISSION_GROUPS,
  grantedPermissions,
  permissionForPath,
  type PermissionGroup,
} from '@/lib/admin-permissions';
import type { AdminPermission } from '@/mock/schema';
import { useHydrated, useStore } from '@/mock/store';

/**
 * The glyph each area wears, and the only thing about the sidebar that still
 * lives here.
 *
 * The list of destinations moved to `lib/admin-permissions.ts`, because it was
 * two lists pretending to be one: this file decided what was in the menu, and a
 * line further down decided who could see the menu, and nothing connected them.
 * A `Record<AdminPermission, …>` means a new area cannot reach the sidebar
 * without also reaching the rights matrix — the compiler asks for its icon here
 * and for its route and group over there, and refuses to build until it has
 * both.
 */
const ICONS: Record<AdminPermission, LucideIcon> = {
  requests: Inbox,
  offers: FileText,
  /* What a paid quote turns into. The calendar answers "what is on Tuesday"
     and cannot answer anything else, so bookings had no list. */
  bookings: CalendarCheck,
  calendar: CalendarDays,
  customers: Users,
  messages: Mail,
  properties: Home,
  keys: KeyRound,
  subscriptions: RefreshCw,
  invoices: Receipt,
  expenses: Wallet,
  analytics: BarChart3,
  catalogue: Tags,
  addons: Sparkles,
  coupons: Percent,
  reviews: Star,
  templates: Mail,
  applications: UserPlus,
  postings: Briefcase,
  /* Not the plain `Users` the customer list wears. These are people too, and
     one glyph for both would put the same picture on «Kunden» and «Benutzer» —
     two rows, four apart, in the same column. The shield is what separates
     them: this list is about access, not about who buys. */
  users: ShieldUser,
  settings: Settings,
  changelog: History,
};

/**
 * Which groups open folded, and the order they sit in.
 *
 * Twenty-odd items in one column is a wall: nothing is findable and the daily
 * three — requests, quotes, calendar — stop reading as the daily three. The
 * order is by frequency, not by the specification's chapter order, and the two
 * groups an owner opens least start folded.
 *
 * `hiring` folds for a second reason. Team is no longer one of its rows — the
 * roster left for «Benutzer» in System, where it sits beside the two other
 * things only the owner touches — so what is left here really is the hiring
 * pipeline and nothing else.
 */
const COLLAPSED: PermissionGroup[] = ['content', 'hiring', 'system'];

const GROUP_LABEL_KEY: Record<SearchGroup, string> = {
  Customers: 'searchGroupCustomers',
  Requests: 'searchGroupRequests',
  Offers: 'searchGroupOffers',
  Invoices: 'searchGroupInvoices',
  Properties: 'searchGroupProperties',
};

/** Which right a search group belongs to, so results cannot outrun the nav. */
const SEARCH_PERMISSION: Record<SearchGroup, AdminPermission> = {
  Customers: 'customers',
  Requests: 'requests',
  Offers: 'offers',
  Invoices: 'invoices',
  Properties: 'properties',
};

/**
 * Admin chrome.
 *
 * Three things worth knowing:
 *
 *  1. It is fully responsive. The client overrode the screen-map's
 *     desktop-first decision in favour of the specification, which says the
 *     owner opens this from a phone between two jobs.
 *  2. **The gate reads rights, not the role.** It used to be one line —
 *     `role !== 'owner'` — which was the whole of the access model: one person
 *     saw all fifty-eight screens and everybody else saw a lock. That was fine
 *     while the roster was the owner and two contractors who never open a
 *     laptop. It stopped being fine the moment the office needed a bookkeeper
 *     who sees three finance screens and nothing else. Now the panel asks
 *     `grantedPermissions`, and so does the sidebar, and so does the URL check
 *     below — one answer, three readers.
 *  3. **The URL is checked too.** Hiding a row would be theatre: `/admin/
 *     finanzen` typed into the bar would still have rendered the margin. The
 *     path is mapped back to the right it needs on every navigation, in this
 *     one place rather than in fifty-eight page files, so a screen added next
 *     month is gated without anybody remembering to gate it.
 *
 * Everything below the gate is AppShell, shared with the customer area.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin.shell');
  const appT = useTranslations('app');
  const demoRoles = useTranslations('demo.roles');
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();

  const role = useStore((s) => s.demo.role);
  const setRole = useStore((s) => s.setRole);
  const data = useStore((s) => s.data);
  const memberId = useStore((s) => s.demo.currentMemberId);

  const member = data.team.find((m) => m.id === memberId);
  const granted = grantedPermissions(member);
  const may = (permission: AdminPermission) => granted.includes(permission);

  const search = useCallback(
    (query: string): CommandGroup[] => {
      /* Looked up inside rather than closed over. Both the member object and
         its permission array are rebuilt on every render, and the React
         Compiler will not preserve a memo whose dependency it cannot prove
         stable — so the dependency is the id, which is a string. */
      const allowed = new Set(
        grantedPermissions(data.team.find((m) => m.id === memberId)),
      );
      const hits = searchAll(data, query);
      const groups: CommandGroup[] = SEARCH_GROUPS
        /*
         * The palette was the hole in the model. Rights hide a row and gate a
         * route; the search reached straight past both — a bookkeeper typing a
         * street name got the customer, the request and the quote back, each
         * one a link to a screen the gate would then refuse. Refusing after
         * showing the answer is worse than not showing it: the record has
         * already been read off the result line.
         */
        .filter((group) => allowed.has(SEARCH_PERMISSION[group]))
        .map((group) => ({
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
        }))
        .filter((group) => group.items.length > 0);

      /*
       * The palette keeps five rows per group, so a street name shared by nine
       * customers silently loses four of them — and screen 84, the full search,
       * had no inbound link anywhere to go and find them on. This row appears
       * only when something was actually cut, and carries the query across, so
       * the wider list opens on the same search rather than an empty field.
       *
       * Counted over the groups this reader may see, not over every hit:
       * «und 12 weitere» that resolve to records they cannot open would be a
       * number that promises something the next screen takes away.
       */
      const visible = hits.filter((hit) => allowed.has(SEARCH_PERMISSION[hit.group]));
      const shown = groups.reduce((n, group) => n + group.items.length, 0);
      if (visible.length > shown) {
        const href = `/admin/suche?q=${encodeURIComponent(query)}`;
        groups.push({
          key: 'all',
          label: appT('searchGroupAll'),
          items: [
            {
              id: 'search-all',
              label: appT('searchAllResults', { total: visible.length }),
              href,
              onSelect: () => router.push(href),
            },
          ],
        });
      }

      return groups;
    },
    [data, memberId, appT, router],
  );

  /*
   * Three refusals, three different sentences.
   *
   * "You are signed in as a customer", "your account has been switched off"
   * and "you have no areas yet" are not the same news, and the person reading
   * one of them can only act on it if it says which one it is. A single
   * «Nur für den Inhaber» covered all three and was wrong about two.
   */
  if (hydrated && (role === 'visitor' || role === 'customer')) {
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

  if (hydrated && member && !member.active) {
    return (
      <AccessGate
        title={t('gateDeactivatedTitle')}
        body={t('gateDeactivatedBody')}
        action={
          <Button asChild variant="secondary">
            <Link href="/">{t('gateHome')}</Link>
          </Button>
        }
      />
    );
  }

  if (hydrated && granted.length === 0) {
    return (
      <AccessGate
        title={t('gateNoAccessTitle')}
        body={t('gateNoAccessBody')}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            {/* The field interface, for the person this gate is mostly about:
                a contractor with no console rights still has a working day to
                look at, and sending them to the marketing home page would read
                as "there is nothing here for you". */}
            <Button asChild>
              <Link href="/einsatz">{t('gateFieldView')}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">{t('gateHome')}</Link>
            </Button>
          </div>
        }
      />
    );
  }

  const waitingRequests =
    hydrated && may('requests')
      ? data.requests.filter((r) => r.status === 'new' || r.status === 'inReview')
      : [];

  /* The sidebar footer used to print "Marco Brunner" as a literal, so the
     scenario's own team data and the name on screen could disagree. The field
     shell already read it from the store; this now does the same. */
  const userName = member ? `${member.firstName} ${member.lastName}` : t('title');
  const roleLabel = member ? t(`roles.${member.role}`) : demoRoles(role);

  const nav: AppNavGroup[] = [
    /* The dashboard is not a right and so is not in `AREAS` — it is the home
       everybody who gets this far lands on. It filters its own blocks instead;
       see screen 51. */
    {
      key: 'home',
      items: [
        {
          href: '/admin',
          label: t('nav.dashboard'),
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    ...PERMISSION_GROUPS.map((group) => ({
      key: group,
      label: t(`groups.${group}`),
      defaultCollapsed: COLLAPSED.includes(group),
      items: AREAS.filter((area) => area.group === group && may(area.permission)).map(
        (area) => ({
          href: area.href,
          label: t(`nav.${area.permission}`),
          icon: ICONS[area.permission],
          badge: area.permission === 'requests' ? waitingRequests.length : undefined,
        }),
      ),
    })),
    /* A heading with nothing under it is a group that looks broken rather than
       one that is empty — and on a three-right account, four of the six would
       have been exactly that. */
  ].filter((group) => group.items.length > 0);

  function signOut() {
    setRole('visitor');
    toast.success(appT('signOutConfirm'));
    router.push('/');
  }

  /*
   * The route this reader is standing on, checked against what they hold.
   *
   * Rendered inside the shell rather than as the full-page `AccessGate` above.
   * The distinction is real: the gates above are for somebody who has no
   * business in the console at all, and showing them its navigation would be
   * showing them the shape of a thing they cannot use. This one is for
   * somebody who belongs here and has walked into the one room they may not
   * enter — they need their own sidebar to walk back out of it.
   */
  const needed = permissionForPath(pathname);
  const denied = hydrated && needed !== null && !may(needed);

  return (
    <AppShell
      nav={nav}
      navLabel={t('title')}
      homeHref="/admin"
      user={{ name: userName, role: roleLabel }}
      onSignOut={signOut}
      notifications={waitingRequests.slice(0, 6).map((request) => ({
        id: request.id,
        title: request.reference,
        detail: customerLabel(data, request.customerId),
        href: `/admin/anfragen/${request.id}`,
      }))}
      notificationsHref={may('requests') ? '/admin/anfragen' : undefined}
      search={search}
    >
      {denied ? (
        <EmptyState
          icon={Lock}
          headingLevel={1}
          title={t('areaLockedTitle', { area: t(`nav.${needed}`) })}
          body={t('areaLockedBody')}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin">{t('areaLockedAction')}</Link>
            </Button>
          }
        />
      ) : (
        children
      )}
    </AppShell>
  );
}

function customerLabel(
  data: { customers: { id: string; firstName: string; lastName: string }[] },
  id: string,
) {
  const customer = data.customers.find((c) => c.id === id);
  return customer ? `${customer.firstName} ${customer.lastName}` : '—';
}
