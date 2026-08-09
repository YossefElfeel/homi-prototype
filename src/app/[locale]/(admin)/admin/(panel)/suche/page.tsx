'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/field';
import { useHydrated, useStore } from '@/mock/store';

interface Hit {
  group: 'Customers' | 'Requests' | 'Offers' | 'Invoices' | 'Properties';
  id: string;
  title: string;
  detail: string;
  href: string;
}

/**
 * Screen 84 — one search across everything.
 *
 * The owner arrives here from a phone call: someone says a street name, or
 * reads out an invoice number, and the answer has to be one field away. So
 * matching is deliberately loose — name, reference, street, postcode, email,
 * phone and QR reference all hit the same box — and results stay grouped so a
 * reference that matches two entities shows both rather than picking one.
 */
export default function AdminSearchPage() {
  const t = useTranslations('admin.search');
  const hydrated = useHydrated();

  const data = useStore((s) => s.data);
  const [query, setQuery] = useState('');

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const has = (...values: (string | undefined)[]) =>
      values.some((v) => v?.toLowerCase().includes(q));

    const customerName = (id: string) => {
      const c = data.customers.find((x) => x.id === id);
      return c ? `${c.firstName} ${c.lastName}` : '—';
    };

    const results: Hit[] = [];

    for (const c of data.customers) {
      if (has(c.firstName, c.lastName, `${c.firstName} ${c.lastName}`, c.email, c.phone)) {
        results.push({
          group: 'Customers',
          id: c.id,
          title: `${c.firstName} ${c.lastName}`,
          detail: c.email,
          href: `/admin/kunden/${c.id}`,
        });
      }
    }

    for (const p of data.properties) {
      if (has(p.street, p.postcode, p.city, `${p.postcode} ${p.city}`)) {
        results.push({
          group: 'Properties',
          id: p.id,
          title: p.street,
          detail: `${p.postcode} ${p.city} · ${customerName(p.customerId)}`,
          href: `/admin/objekte/${p.id}`,
        });
      }
    }

    for (const r of data.requests) {
      if (has(r.reference, customerName(r.customerId))) {
        results.push({
          group: 'Requests',
          id: r.id,
          title: r.reference,
          detail: customerName(r.customerId),
          href: `/admin/anfragen/${r.id}`,
        });
      }
    }

    for (const o of data.offers) {
      const request = data.requests.find((r) => r.id === o.requestId);
      if (has(o.reference, request && customerName(request.customerId))) {
        results.push({
          group: 'Offers',
          id: o.id,
          title: o.reference,
          detail: request ? customerName(request.customerId) : '—',
          href: `/admin/offerten/${o.id}`,
        });
      }
    }

    for (const i of data.invoices) {
      if (has(i.reference, i.qrReference, customerName(i.customerId))) {
        results.push({
          group: 'Invoices',
          id: i.id,
          title: i.reference,
          detail: customerName(i.customerId),
          href: `/admin/rechnungen/${i.id}`,
        });
      }
    }

    return results;
  }, [query, data]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const groups: { key: Hit['group']; label: string }[] = [
    { key: 'Customers', label: t('groupCustomers') },
    { key: 'Requests', label: t('groupRequests') },
    { key: 'Offers', label: t('groupOffers') },
    { key: 'Invoices', label: t('groupInvoices') },
    { key: 'Properties', label: t('groupProperties') },
  ];

  const typing = query.trim().length >= 2;

  return (
    <div className="max-w-3xl">
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
          {groups.map((group) => {
            const items = hits.filter((h) => h.group === group.key);
            if (items.length === 0) return null;
            return (
              <section key={group.key} className="mt-6">
                <h2 className="label-type text-ink-secondary">{group.label}</h2>
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
