'use client';

import { use, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useFormatter } from '@/i18n/format';
import { KeyRound, Plus, Search, ShieldAlert } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { ActionIcon } from '@/lib/action-icons';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { RowAction, RowActionButton, RowActions } from '@/components/ui/row-actions';
import { StatusBadge } from '@/components/ui/status-badge';
import { Toolbar } from '@/components/ui/toolbar';
import { ReturnKeyDialog } from '@/components/admin/return-key-dialog';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { KeyLogEntry, KeyStatus } from '@/mock/schema';

/**
 * Screen 68 — the key log, and the one screen in the admin panel with a
 * genuinely locked state.
 *
 * §21 item 12: holding customer keys permanently is not enabled until a
 * liability policy exists. That is not a nice-to-have gate — without cover the
 * owner carries the risk personally and the customer has none, so the screen
 * says exactly that rather than a generic "feature unavailable".
 *
 * Toggle "Haftpflichtversicherung" in the demo controls to switch between the
 * two states.
 */
export default function KeyLogPage({
  searchParams,
}: {
  /**
   * Which key to open the return dialog on. Handing a key back is a dialog
   * rather than a page, and a step that exists only as component state is a
   * step nothing can link to — /screens and /flows both point at it. Same
   * arrangement as `?action=reject` on a request.
   */
  searchParams: Promise<{ zurueckgeben?: string }>;
}) {
  const { zurueckgeben } = use(searchParams);
  const t = useTranslations('admin.keys');
  const appT = useTranslations('app');
  const statusT = useTranslations('status.key');
  const format = useFormatter();
  const hydrated = useHydrated();

  const keyLog = useStore((s) => s.data.keyLog);
  const properties = useStore((s) => s.data.properties);
  const customers = useStore((s) => s.data.customers);
  const settings = useStore((s) => s.settings);
  const recordKey = useStore((s) => s.recordKey);
  const now = useNow();

  const [adding, setAdding] = useState(false);
  /*
   * Which customer the new key belongs to. Held here rather than read off the
   * form on submit, because the property list below it is filtered by it —
   * that is the whole point of the control.
   */
  const [formCustomer, setFormCustomer] = useState('');
  const [status, setStatus] = useState<'all' | KeyStatus>('all');
  const [query, setQuery] = useState('');
  const [returning, setReturning] = useState<string | null>(zurueckgeben ?? null);

  const customerName = useMemo(() => {
    const byId = new Map(customers.map((c) => [c.id, `${c.lastName}, ${c.firstName}`]));
    return (id: string | undefined) => (id ? (byId.get(id) ?? '—') : '—');
  }, [customers]);

  /*
   * Both orders of the name, for the search only.
   *
   * The column prints «Keller, Andrea» because that is how a list sorts, but
   * nobody says it that way — the person on the phone is "Andrea Keller".
   * Searching the rendered string alone would miss every full name typed the
   * way it is spoken, which is the way it will be typed.
   */
  const customerSearch = useMemo(() => {
    const byId = new Map(
      customers.map((c) => [c.id, `${c.firstName} ${c.lastName} ${c.lastName}, ${c.firstName}`]),
    );
    return (id: string | undefined) => (id ? (byId.get(id) ?? '') : '');
  }, [customers]);

  const propertyOf = useMemo(() => {
    const byId = new Map(properties.map((p) => [p.id, p]));
    return (id: string) => byId.get(id);
  }, [properties]);

  /* A customer with no address on file cannot hand over a key to anything, so
     offering their name would produce a second dropdown with nothing in it. */
  const keyholders = useMemo(
    () => customers.filter((c) => properties.some((p) => p.customerId === c.id)),
    [customers, properties],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return keyLog
      .filter((k) => (status === 'all' ? true : k.status === status))
      .filter((k) => {
        if (!q) return true;
        const property = properties.find((p) => p.id === k.propertyId);
        /*
         * The storage location is first because it is the field this screen is
         * searched *backwards* from: somebody is standing at the cupboard with
         * a tag reading «Fach 3» and needs to know whose door it opens. Every
         * other list here is searched by who or where; this one is also
         * searched by the label on the key itself.
         *
         * The two names are in for the same reason they are recorded at all —
         * "who took the Meilen key in" is a question about a person, and the
         * answer used to require reading the column.
         */
        return [
          k.storageLocation,
          property?.label,
          property?.street,
          property?.postcode,
          property?.city,
          customerSearch(property?.customerId),
          k.receivedBy,
          k.returnedTo,
          k.returnedBy,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q);
      });
  }, [keyLog, status, query, properties, customerSearch]);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  if (!settings.hasLiabilityInsurance) {
    return (
      <div className="max-w-2xl">
        <h1 className="display-type text-3xl">{t('title')}</h1>
        <div className="mt-8 flex gap-4 rounded-[var(--radius-lg)] border border-status-warning-line bg-status-warning p-6 text-status-warning-fg">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <h2 className="font-medium">{t('lockedTitle')}</h2>
            <p className="mt-2 text-sm">{t('lockedBody')}</p>
          </div>
        </div>
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/admin/einstellungen?tab=fees">{t('lockedAction')}</Link>
        </Button>
        <p className="mt-3 text-xs text-ink-tertiary">{t('lockedHint')}</p>
      </div>
    );
  }

  const filtering = status !== 'all' || Boolean(query.trim());
  const formProperties = properties.filter((p) => p.customerId === formCustomer);

  const columns: Column<KeyLogEntry>[] = [
    {
      key: 'property',
      header: t('colProperty'),
      primary: true,
      cell: (k) => propertyOf(k.propertyId)?.label ?? '—',
      sortBy: (k) => (propertyOf(k.propertyId)?.label ?? '').toLowerCase(),
    },
    {
      key: 'status',
      header: t('colStatus'),
      trailing: true,
      /* Was two hand-typed sets of `status-*` classes in this cell, which made
         the key log the one screen writing its own state colours — and the
         property record drew the same two states as a `Chip` with its own
         tones. Both now read `status-registry.ts`. */
      cell: (k) => <StatusBadge entity="key" state={k.status} size="sm" />,
      sortBy: (k) => k.status,
    },
    {
      key: 'customer',
      header: t('colCustomer'),
      cell: (k) => customerName(propertyOf(k.propertyId)?.customerId),
      sortBy: (k) => customerName(propertyOf(k.propertyId)?.customerId).toLowerCase(),
    },
    {
      /* Date and person in one column rather than two. The handover back needs
         a column of its own now and it carries the same pair, so seven columns
         of this table were about two events — printing each event as one cell
         is what lets them sit side by side and be read as a pair. */
      key: 'received',
      header: t('colReceived'),
      cell: (k) => (
        <span>
          <span data-numeric className="block text-ink-secondary">
            {format.dateTime(new Date(k.receivedAt), 'short')}
          </span>
          <span className="block text-sm text-ink-tertiary">{k.receivedBy}</span>
        </span>
      ),
      sortBy: (k) => k.receivedAt,
    },
    {
      key: 'storage',
      header: t('colStorage'),
      cell: (k) => <span className="text-ink-secondary">{k.storageLocation}</span>,
    },
    {
      /*
       * The returned half of the record, which had nowhere to be printed.
       *
       * This column used to be the action strip: a button on a held key, the
       * return date on a closed one. So the one column changed meaning per row,
       * and everything the return recorded beyond a timestamp — who handed it
       * over, who took it — was written nowhere and read nowhere. The actions
       * moved into the row menu; this says what happened.
       */
      key: 'returned',
      header: t('colReturned'),
      cell: (k) =>
        k.returnedAt ? (
          <span>
            <span data-numeric className="block text-ink-secondary">
              {format.dateTime(new Date(k.returnedAt), 'short')}
            </span>
            {k.returnedTo && (
              <span className="block text-sm text-ink-tertiary">
                {t('returnedToShort', { to: k.returnedTo })}
              </span>
            )}
          </span>
        ) : (
          <span className="text-ink-tertiary">{t('stillHeld')}</span>
        ),
      sortBy: (k) => k.returnedAt ?? null,
    },
  ];

  /* A key belongs to an address. With none on file the form would open on a
     property dropdown that cannot be satisfied, so the button says so first. */
  const addButton = (
    <Button disabled={adding || keyholders.length === 0} onClick={() => setAdding(true)}>
      <Plus className="size-4" aria-hidden />
      {t('addAction')}
    </Button>
  );

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} actions={addButton} />

      {adding && (
        <form
          className="surface-card mb-app-section p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const propertyId = String(form.get('propertyId') ?? '');
            if (!propertyId) return;

            recordKey(
              {
                propertyId,
                receivedBy: String(form.get('receivedBy') ?? ''),
                storageLocation: String(form.get('storageLocation') ?? ''),
              },
              now,
            );
            setAdding(false);
            setFormCustomer('');
            toast.success(t('addDone'));
          }}
        >
          <h2 className="display-type text-xl">{t('newTitle')}</h2>

          {/*
            The customer was not asked for at all, and the property dropdown
            listed every address in the company as «Bezeichnung — Strasse».
            A key is handed over by a person standing at the counter naming
            themselves, not an address — so the office had to translate a name
            into one of sixteen labels before it could record anything, and two
            customers with a flat on the same street was a wrong pick nothing
            downstream would ever catch.

            Asking for the customer first turns that into two short lists.
          */}
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Field label={t('newCustomer')}>
              {(props) => (
                <Select
                  {...props}
                  name="customerId"
                  required
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                >
                  <option value="" disabled>
                    {t('newCustomerPlaceholder')}
                  </option>
                  {keyholders.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.lastName}, {c.firstName}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field
              label={t('colProperty')}
              hint={formCustomer ? undefined : t('newPropertyLocked')}
              className="sm:col-span-2"
            >
              {(props) => (
                <Select
                  {...props}
                  /* Remounted per customer so the previous customer's pick
                     cannot survive as a selected option that is no longer in
                     the list — a `<select>` keeps a value whose `<option>`
                     has gone, and the form would submit it. */
                  key={formCustomer}
                  name="propertyId"
                  required
                  disabled={!formCustomer}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t('newPropertyPlaceholder')}
                  </option>
                  {formProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {p.street}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label={t('colBy')} hint={t('newByHint')}>
              {(props) => <Input {...props} name="receivedBy" required />}
            </Field>
            <Field label={t('colStorage')} hint={t('newStorageHint')}>
              {(props) => <Input {...props} name="storageLocation" required />}
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit">{t('newSave')}</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setFormCustomer('');
              }}
            >
              {t('dismiss')}
            </Button>
          </div>
        </form>
      )}

      {/* «Welche Schlüssel haben wir gerade?» is the question this screen is
          opened with, and it was answered by reading the badge on every row —
          the log keeps returned keys for ever (§13.2), so the list only grows
          away from the answer. The search box is the other half of the same
          problem: a register that never loses a row is one nobody can scan for
          a single address, and this one is scanned *from the cupboard* as often
          as from the office. The count is the confirmation either of them did
          anything. */}
      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          placeholder: t('searchPlaceholder'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: filtered.length, total: keyLog.length })
            : appT('resultsAll', { total: keyLog.length })
        }
        filters={
          <label className="min-w-44">
            <span className="sr-only">{t('filterStatus')}</span>
            <Select
              dense
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="all">
                {t('filterStatus')}: {t('filterAll')}
              </option>
              <option value="held">{statusT('held')}</option>
              <option value="returned">{statusT('returned')}</option>
            </Select>
          </label>
        }
      />

      <DataView
        items={filtered}
        columns={columns}
        getKey={(k) => k.id}
        caption={t('title')}
        defaultSort={{ key: 'received', dir: 'desc' }}
        /*
         * A key row had one control — «Rückgabe erfassen» — and no way out to
         * the address it belongs to. Which is the thing every question about a
         * key ends at: whose door, what access, is a job booked there. The jump
         * was the sidebar, /admin/objekte, and a search for a label read off
         * this table.
         */
        rowActions={(k) => (
          <RowActions>
            <RowAction href={`/admin/objekte/${k.propertyId}`} label={t('rowProperty')}>
              <ActionIcon.property aria-hidden />
            </RowAction>
            <RowActionButton
              /* Kept on a returned key rather than dropped, so the menu is the
                 same length on every row and the reason is read rather than
                 inferred from an absence. */
              disabled={k.status === 'returned'}
              label={k.status === 'returned' ? t('rowReturnDone') : t('returnAction')}
              onClick={() => setReturning(k.id)}
            >
              <ActionIcon.handBack aria-hidden />
            </RowActionButton>
          </RowActions>
        )}
        empty={
          /* Three ways to be empty and they need three different sentences.
             Keying this on the data alone would answer "nothing for Bergstrasse"
             with "keys are recorded when you take one in" — an explanation of
             how to create the rows that were on screen a second ago. */
          filtering ? (
            <EmptyState
              icon={Search}
              title={query.trim() ? t('searchEmptyTitle') : t('filterEmptyTitle')}
              body={
                query.trim()
                  ? t('searchEmptyBody', { query: query.trim() })
                  : t('filterEmptyBody', {
                      status: status === 'held' ? statusT('held') : statusT('returned'),
                    })
              }
            />
          ) : (
            <EmptyState
              icon={KeyRound}
              title={t('emptyTitle')}
              body={keyholders.length === 0 ? t('emptyNoProperties') : t('emptyBody')}
              action={keyholders.length > 0 ? addButton : undefined}
            />
          )
        }
      />

      {/* A link can be followed to a key that has already gone back, or to an
          id that no longer exists at all. It opens on the same condition the
          menu item is enabled under, so the deep link cannot reach a return
          the screen itself refuses to offer. */}
      <ReturnKeyDialog
        keyId={keyLog.some((k) => k.id === returning && k.status === 'held') ? returning : null}
        onClose={() => setReturning(null)}
      />
    </div>
  );
}
