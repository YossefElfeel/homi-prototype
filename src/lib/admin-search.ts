import type { DataSet } from '@/mock/scenarios';

export type SearchGroup =
  | 'Customers'
  | 'Requests'
  | 'Offers'
  | 'Invoices'
  | 'Properties';

export interface SearchHit {
  group: SearchGroup;
  id: string;
  title: string;
  detail: string;
  href: string;
}

export const SEARCH_GROUPS: SearchGroup[] = [
  'Customers',
  'Requests',
  'Offers',
  'Invoices',
  'Properties',
];

/** Below this a query matches half the dataset and the list is noise. */
export const MIN_QUERY = 2;

/**
 * The unified search, lifted out of screen 84 so the command palette and the
 * search page cannot drift apart — one of them silently missing an entity type
 * is exactly the kind of divergence that survives review.
 *
 * Matching stays deliberately loose. The owner arrives here from a phone call:
 * someone reads out a street name, a reference or the QR line off an invoice,
 * and the answer has to be one field away. Results stay grouped so a reference
 * that matches two entities shows both rather than the code picking one.
 */
export function searchAll(data: DataSet, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY) return [];

  const has = (...values: (string | undefined)[]) =>
    values.some((v) => v?.toLowerCase().includes(q));

  const customerName = (id: string) => {
    const c = data.customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  const results: SearchHit[] = [];

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
        /* Screen 57's rows used to leave the panel entirely for the customer's
           own quote page, whose only exit is the marketing home page. The
           admin-side detail keeps the owner inside the console. */
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
}
