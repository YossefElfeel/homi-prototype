'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Lock, Search } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/field';
import { MIN_QUERY, SEARCH_GROUPS, searchAll, type SearchGroup } from '@/lib/admin-search';
import { grantedPermissions } from '@/lib/admin-permissions';
import { useHydrated, useStore } from '@/mock/store';
import type { AdminPermission } from '@/mock/schema';

/** Which right a group belongs to. The palette holds the same map. */
const GROUP_PERMISSION: Record<SearchGroup, AdminPermission> = {
  Customers: 'customers',
  Requests: 'requests',
  Offers: 'offers',
  Invoices: 'invoices',
  Properties: 'properties',
};

const GROUP_LABEL_KEY: Record<SearchGroup, string> = {
  Customers: 'groupCustomers',
  Requests: 'groupRequests',
  Offers: 'groupOffers',
  Invoices: 'groupInvoices',
  Properties: 'groupProperties',
};

/**
 * Screen 84 — one search across everything.
 *
 * The owner arrives here from a phone call: someone says a street name, or
 * reads out an invoice number, and the answer has to be one field away. So
 * matching is deliberately loose — name, reference, street, postcode, email,
 * phone and QR reference all hit the same box — and results stay grouped so a
 * reference that matches two entities shows both rather than picking one.
 *
 * **The matching itself is `searchAll` now.** `lib/admin-search.ts` was written
 * to stop this screen and the ⌘K palette drifting apart, and then this screen
 * kept its own copy of the loop — so they drifted anyway. The palette learned to
 * match a property's `label` («Büro Seestrasse», the one name the office
 * actually uses) and this page did not, which meant the narrower surface found
 * something the wider one could not.
 *
 * **And it is gated.** Rights hide a sidebar row and refuse a URL; a search that
 * reached past both would hand a bookkeeper the customer, the request and the
 * quote behind one street name, each as a link to a screen the shell then
 * refuses. Refusing after showing the answer is worse than not showing it — the
 * record has already been read off the result line.
 */
export default function AdminSearchPage() {
  const t = useTranslations('admin.search');
  const shell = useTranslations('admin.shell');
  const hydrated = useHydrated();

  const data = useStore((s) => s.data);
  const memberId = useStore((s) => s.demo.currentMemberId);
  const granted = grantedPermissions(data.team.find((m) => m.id === memberId));

  /* Seeded from ?q so the palette's «see all results» row lands on the search
     it was showing, not on an empty field the owner has to retype. Initial
     state only — after that the box owns the query, or every keystroke would
     fight the URL. */
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');

  const visibleGroups = useMemo(
    () => SEARCH_GROUPS.filter((group) => granted.includes(GROUP_PERMISSION[group])),
    [granted],
  );

  const hits = useMemo(
    () =>
      searchAll(data, query).filter((hit) => granted.includes(GROUP_PERMISSION[hit.group])),
    [data, query, granted],
  );

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const typing = query.trim().length >= MIN_QUERY;

  /* Nothing at all is searchable for this account — a real state on a finance
     account, and one that has to say why rather than reporting «0 Treffer» for
     every query somebody types. */
  if (visibleGroups.length === 0) {
    return (
      <div>
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <EmptyState
          className="mt-10"
          icon={Lock}
          title={shell('areaLockedTitle', { area: t('title') })}
          body={shell('areaLockedBody')}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      <Field label={t('title')} className="mt-8">
        {(props) => (
          <div className="relative">
            <Search
              className="pointer-events-none absolute inset-inline-start-3 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
              aria-hidden
            />
            <Input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('placeholder')}
              className="ps-10"
              {...props}
            />
          </div>
        )}
      </Field>

      {!typing ? (
        <EmptyState className="mt-10" title={t('idleTitle')} body={t('idleBody')} />
      ) : hits.length === 0 ? (
        <EmptyState
          className="mt-10"
          title={t('emptyTitle')}
          body={t('emptyBody', { query: query.trim() })}
        />
      ) : (
        <>
          <p aria-live="polite" className="mt-8 text-sm text-ink-tertiary">
            {t('resultCount', { n: hits.length })}
          </p>
          {visibleGroups.map((group) => {
            const items = hits.filter((h) => h.group === group);
            if (items.length === 0) return null;
            return (
              <section key={group} className="mt-6">
                <h2 className="label-type text-ink-secondary">
                  {t(GROUP_LABEL_KEY[group])}
                </h2>
                <ul className="mt-2 border-t border-line-subtle">
                  {items.map((hit) => (
                    <li key={`${hit.group}-${hit.id}`} className="border-b border-line-subtle">
                      <Link
                        href={hit.href}
                        className="flex min-h-11 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-3 transition-colors hover:bg-sunken"
                      >
                        <span className="font-medium">{hit.title}</span>
                        <span className="text-sm text-ink-secondary">{hit.detail}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
