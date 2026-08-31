'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Bell,
  Check,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Rows2,
  Rows3,
  Search,
  type LucideIcon,
} from 'lucide-react';

import { Link, usePathname } from '@/i18n/navigation';
import { Logo } from '@/components/site/logo';
import { Avatar } from '@/components/ui/avatar';
import {
  CommandPalette,
  useCommandPalette,
  type CommandGroup,
} from '@/components/ui/command-palette';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { applyDensity, applySidebar } from '@/lib/preferences';
import { DENSITIES, type Density, type SidebarState } from '@/lib/theme';
import { NavGroup, type AppNavGroup, type AppNavItem } from './nav-item';

export type { AppNavGroup, AppNavItem };

export interface AppNotification {
  id: string;
  title: string;
  detail?: string;
  href: string;
}

/**
 * One shell for every signed-in area.
 *
 * What it replaces: two shells whose nav item markup was byte-identical, whose
 * sidebars were 16rem and 15rem, whose headers were 64px and "whatever the
 * marketing header is", and whose mobile drawers were both a bare fixed div
 * with no scrim and no focus trap.
 *
 * It also carries the three things neither of them had:
 *
 *  · a sign-out control — `admin.shell.signOut` and `account.shell.signOut`
 *    were defined in all four locale files and rendered by nothing, so the
 *    only way out of a signed-in session was the demo bar, which the code
 *    itself describes as "never part of the product"
 *  · ⌘K over the same matcher the search screen uses
 *  · the density switch, which is why the --app-* tokens exist
 */
export function AppShell({
  nav,
  navLabel,
  homeHref,
  user,
  onSignOut,
  notifications,
  notificationsHref,
  search,
  children,
  contentClassName,
}: {
  nav: AppNavGroup[];
  navLabel: string;
  /** Where the logo goes — the area root, not the marketing home page. */
  homeHref: string;
  user: { name: string; role: string };
  onSignOut: () => void;
  notifications?: AppNotification[];
  notificationsHref?: string;
  /** Entity matches for ⌘K. Nav destinations are added on top of these. */
  search?: (query: string) => CommandGroup[];
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const t = useTranslations('app');
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const palette = useCommandPalette();

  /* Read from the DOM, like the density switch: the server already stamped
     data-sidebar on <html> from the cookie, so this starts correct and the
     rail never renders wide and then snaps narrow. */
  const [sidebar, setSidebar] = useState<SidebarState>(() => {
    if (typeof document === 'undefined') return 'expanded';
    return document.documentElement.dataset.sidebar === 'collapsed'
      ? 'collapsed'
      : 'expanded';
  });
  const railed = sidebar === 'collapsed';

  function toggleSidebar() {
    const next: SidebarState = railed ? 'expanded' : 'collapsed';
    setSidebar(next);
    applySidebar(next);
  }

  const isActive = (item: AppNavItem) =>
    (item.exact ? pathname === item.href : pathname.startsWith(item.href)) ||
    /* A section whose screens do not all sit under one prefix — see `owns` on
       AppNavItem. Checked after the href so the ordinary case is unchanged. */
    (item.owns?.some((prefix) => pathname.startsWith(prefix)) ?? false);

  const flatNav = useMemo(() => nav.flatMap((group) => group.items), [nav]);

  /* Every nav destination is reachable from the palette, which is why there is
     no second search box inside the sidebar: it would be the same list, twice,
     one of them permanently taking up space. */
  const groups = useMemo<CommandGroup[]>(() => {
    const q = query.trim().toLowerCase();
    const pages = flatNav
      .filter((item) => !q || item.label.toLowerCase().includes(q))
      .slice(0, 8)
      .map((item) => ({
        id: `nav-${item.href}`,
        label: item.label,
        href: item.href,
        icon: item.icon as LucideIcon,
      }));

    return [
      { key: 'pages', label: t('searchGroupPages'), items: pages },
      ...(search?.(query) ?? []),
    ];
  }, [flatNav, query, search, t]);

  /* `rail` is never passed by the mobile drawer: the drawer is already a
     full-width overlay, so collapsing it to icons there would shrink the one
     surface that has room. */
  const navTree = (onNavigate?: () => void, rail = false) => (
    <div className={cn(rail ? 'space-y-2' : 'space-y-5')}>
      {nav.map((group) => (
        <NavGroup
          key={group.key}
          group={group}
          isActive={isActive}
          onNavigate={onNavigate}
          collapseLabel={t('collapseGroup')}
          rail={rail}
        />
      ))}
    </div>
  );

  return (
    /* data-scope is what swaps the whole token set from editorial to console.
       Everything below here reads modern radii, real elevation and Geist; the
       marketing site outside this subtree is untouched. */
    <div
      data-scope="app"
      className="min-h-dvh bg-page text-ink lg:grid lg:grid-cols-[var(--app-sidebar-w)_1fr]"
    >
      <aside className="hidden border-r border-line-subtle bg-card lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div
            className={cn(
              'flex h-topbar shrink-0 items-center',
              railed ? 'justify-center px-2' : 'px-5',
            )}
          >
            <Link
              href={homeHref}
              className="rounded-[var(--radius-xs)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
              aria-label={railed ? navLabel : undefined}
            >
              {/* The wordmark does not fit a 4rem rail; the mark alone does,
                  and it is the same component the mobile header already uses
                  without it. */}
              <Logo showMark showWordmark={!railed} />
            </Link>
          </div>

          <nav
            aria-label={navLabel}
            className={cn('flex-1 overflow-y-auto py-2', railed ? 'px-2' : 'px-2')}
          >
            {navTree(undefined, railed)}
          </nav>

          <div className="shrink-0 space-y-0.5 border-t border-line-subtle p-2">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={railed ? t('sidebarExpand') : t('sidebarCollapse')}
              title={railed ? t('sidebarExpand') : t('sidebarCollapse')}
              className={cn(
                'flex min-h-10 w-full items-center rounded-[var(--radius-sm)] text-sm text-ink-tertiary transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
                railed ? 'justify-center px-2' : 'gap-2.5 px-3',
              )}
            >
              {railed ? (
                <PanelLeftOpen className="size-4 shrink-0" aria-hidden />
              ) : (
                <PanelLeftClose className="size-4 shrink-0" aria-hidden />
              )}
              {!railed && t('sidebarCollapse')}
            </button>

            <Link
              href="/"
              aria-label={railed ? t('backToSite') : undefined}
              title={railed ? t('backToSite') : undefined}
              className={cn(
                'flex min-h-10 items-center rounded-[var(--radius-sm)] text-sm text-ink-tertiary transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus',
                railed ? 'justify-center px-2' : 'gap-2.5 px-3',
              )}
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              {!railed && t('backToSite')}
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-topbar items-center gap-2 border-b border-line-subtle bg-page/85 px-gutter backdrop-blur-md">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('menu')}
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-ink-secondary transition-colors hover:bg-sunken hover:text-ink lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <Link href={homeHref} className="lg:hidden">
            <Logo showMark={false} />
          </Link>

          <button
            type="button"
            onClick={() => palette.setOpen(true)}
            className="ms-auto hidden h-9 min-w-64 items-center gap-2 rounded-[var(--radius-sm)] border border-line-subtle bg-card px-3 text-sm text-ink-tertiary transition-colors hover:border-line hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus sm:flex"
          >
            <Search className="size-4" aria-hidden />
            <span className="flex-1 text-left">{t('search')}</span>
            <kbd className="rounded-[var(--radius-xs)] border border-line-subtle bg-sunken px-1.5 py-0.5 text-2xs text-ink-tertiary">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => palette.setOpen(true)}
            aria-label={t('search')}
            className="ms-auto inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-ink-secondary transition-colors hover:bg-sunken hover:text-ink sm:hidden"
          >
            <Search className="size-5" aria-hidden />
          </button>

          {notifications && (
            <NotificationsMenu
              items={notifications}
              href={notificationsHref}
              label={t('notifications')}
              emptyLabel={t('notificationsEmpty')}
              allLabel={t('notificationsAll')}
            />
          )}

          <DensityMenu />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t('userMenu')}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] p-1 transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
            >
              <Avatar name={user.name} size="md" />
              <span className="hidden text-sm font-medium lg:inline">{user.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.role}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/">
                  <ArrowLeft aria-hidden />
                  {t('backToSite')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem tone="danger" onSelect={onSignOut}>
                <LogOut aria-hidden />
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main
          id="main"
          className={cn('flex-1 px-gutter py-app-section', contentClassName)}
        >
          {children}
        </main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" closeLabel={t('menu')} className="p-0">
          <SheetHeader>
            <SheetTitle>{navLabel}</SheetTitle>
          </SheetHeader>
          <nav aria-label={navLabel} className="flex-1 overflow-y-auto px-2 py-3">
            {navTree(() => setMenuOpen(false))}
          </nav>
          <div className="border-t border-line-subtle p-2">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-sm text-ink-tertiary transition-colors hover:bg-sunken hover:text-ink"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t('backToSite')}
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      <CommandPalette
        open={palette.open}
        onOpenChange={palette.setOpen}
        groups={groups}
        query={query}
        onQueryChange={setQuery}
        label={t('search')}
        placeholder={t('searchPlaceholder')}
        emptyLabel={query.trim() ? t('searchEmpty') : t('searchIdle')}
        hintLabel={t('searchOpenHint')}
      />
    </div>
  );
}

function NotificationsMenu({
  items,
  href,
  label,
  emptyLabel,
  allLabel,
}: {
  items: AppNotification[];
  href?: string;
  label: string;
  emptyLabel: string;
  allLabel: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        className="relative inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-ink-secondary transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
      >
        <Bell className="size-5" aria-hidden />
        {items.length > 0 && (
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rule ring-2 ring-page"
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {items.length === 0 ? (
          <p className="px-2.5 py-6 text-center text-sm text-ink-tertiary">
            {emptyLabel}
          </p>
        ) : (
          items.slice(0, 6).map((item) => (
            <DropdownMenuItem key={item.id} asChild>
              <Link href={item.href} className="flex-col items-start gap-0.5">
                <span className="font-medium">{item.title}</span>
                {item.detail && (
                  <span className="text-xs text-ink-tertiary">{item.detail}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))
        )}
        {href && items.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={href}>{allLabel}</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const DENSITY_ICON: Record<Density, LucideIcon> = {
  comfortable: Rows2,
  compact: Rows3,
};

function DensityMenu() {
  const t = useTranslations('app');
  /* Read from the DOM rather than a store: the server already stamped
     data-density on <html> from the cookie, so this starts correct and never
     flashes the wrong choice. */
  const [density, setDensity] = useState<Density>(() => {
    if (typeof document === 'undefined') return 'comfortable';
    const current = document.documentElement.dataset.density;
    return current === 'compact' ? 'compact' : 'comfortable';
  });

  function choose(next: Density) {
    setDensity(next);
    applyDensity(next);
  }

  const Icon = DENSITY_ICON[density];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('density')}
        className="hidden size-9 items-center justify-center rounded-[var(--radius-sm)] text-ink-secondary transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus sm:inline-flex"
      >
        <Icon className="size-5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('density')}</DropdownMenuLabel>
        {DENSITIES.map((value) => {
          const ValueIcon = DENSITY_ICON[value];
          return (
            <DropdownMenuItem key={value} onSelect={() => choose(value)}>
              <ValueIcon aria-hidden />
              <span className="flex-1">
                {value === 'compact' ? t('densityCompact') : t('densityComfortable')}
              </span>
              {density === value && <Check className="text-ink-accent" aria-hidden />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
