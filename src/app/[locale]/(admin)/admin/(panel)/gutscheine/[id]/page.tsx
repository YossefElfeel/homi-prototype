'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { TicketPercent } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, NumberField, Select, Checkbox } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { couponRemaining, couponState } from '@/lib/coupon-facts';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Coupon } from '@/mock/schema';

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Everything on a coupon the form may change. `id` and `usedCount` are not
    editable: one is the record's identity, the other is what happened. */
type Draft = Omit<Coupon, 'id' | 'usedCount'>;

function draftOf(coupon: Coupon): Draft {
  return {
    code: coupon.code,
    kind: coupon.kind,
    value: coupon.value,
    minOrder: coupon.minOrder,
    services: [...coupon.services],
    validFrom: coupon.validFrom,
    validTo: coupon.validTo,
    maxUses: coupon.maxUses,
    active: coupon.active,
  };
}

function blankCoupon(now: Date): Coupon {
  return {
    id: 'neu',
    code: '',
    kind: 'percent',
    value: 10,
    services: [],
    validFrom: isoDate(now),
    validTo: isoDate(new Date(now.getTime() + 90 * 86_400_000)),
    usedCount: 0,
    /* A new code arrives switched on. Writing one and then having to find a
       second control to turn it on is a step nobody would want, and the
       screen's own save button is already the moment it becomes real. */
    active: true,
  };
}

/**
 * Screen 77 — creating or editing a coupon.
 *
 * `/admin/gutscheine/neu` opens the same form empty. One route, one layout: a
 * separate "new" screen would drift from the edit screen within a month.
 *
 * **The form no longer writes as you type.** Every field ran `patchData` on
 * each keystroke, and only when editing an existing coupon — so the two halves
 * of one screen had opposite saving models, and the half that saved silently
 * was the half operating on live data. What that cost:
 *
 *  · **there was no way out of an edit.** Opening WELCOME10 to check its
 *    ceiling and tabbing through the field was enough to change it. Nothing
 *    was staged, so nothing could be abandoned — the back link and the browser
 *    button both left the change in place, and the only undo was remembering
 *    the old number.
 *  · **half-typed values reached the data.** Clearing the code to retype it
 *    wrote a coupon with an empty code; deleting the leading digit of `150`
 *    wrote a minimum order of 50. Both are states the office would never
 *    choose, and both were saved.
 *  · **the save button was a lie.** It navigated. On an existing coupon it had
 *    written nothing for a long time, because everything above it already had.
 *
 * So the record is read once into a draft, the draft is what the fields edit,
 * and `patchData` runs on the button — which is also what makes it worth
 * checking the draft first. Validation only means something where there is a
 * moment before the write: a duplicate code and a backwards window are both
 * caught here and were both unstoppable when each keystroke was the save.
 */
export default function CouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.coupon');
  const hydrated = useHydrated();
  const now = useNow();

  const coupon = useStore((s) => s.data.coupons.find((c) => c.id === id));

  /*
   * The gate is a component boundary, not an early return, and that matters
   * for the same reason it does on screen 75b: the store is persisted, so the
   * first render is the seed and the stored record lands a tick later. A
   * `useState(() => draftOf(coupon))` up here would seed the form from the
   * seed copy and never look again — a coupon edited in a previous session
   * would open showing the old figures, the screen would report unsaved
   * changes it invented, and saving would write the seed back over the edit.
   */
  if (!hydrated) return <SkeletonPage label={t('back')} />;

  if (id === 'neu') return <CouponEditor coupon={blankCoupon(now)} isNew />;

  if (!coupon) {
    return (
      <div>
        <PageHeader
          title={t('notFoundTitle')}
          back={{ href: '/admin/gutscheine', label: t('back') }}
        />
        <EmptyState
          icon={TicketPercent}
          headingLevel={2}
          title={t('notFoundTitle')}
          body={t('notFoundBody')}
          action={
            <Button asChild>
              <Link href="/admin/gutscheine">{t('back')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <CouponEditor key={coupon.id} coupon={coupon} />;
}

function CouponEditor({ coupon, isNew = false }: { coupon: Coupon; isNew?: boolean }) {
  const t = useTranslations('admin.coupon');
  const listT = useTranslations('admin.coupons');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const now = useNow();

  const coupons = useStore((s) => s.data.coupons);
  const services = useStore((s) => s.services);
  const patchData = useStore((s) => s.patchData);

  const [form, setForm] = useState<Draft>(() => draftOf(coupon));

  const stored = draftOf(coupon);
  const dirty =
    form.code !== stored.code ||
    form.kind !== stored.kind ||
    form.value !== stored.value ||
    form.minOrder !== stored.minOrder ||
    form.maxUses !== stored.maxUses ||
    form.validFrom !== stored.validFrom ||
    form.validTo !== stored.validTo ||
    form.active !== stored.active ||
    form.services.length !== stored.services.length ||
    form.services.some((s) => !stored.services.includes(s));

  const code = form.code.trim();
  /*
   * Two codes, one string typed at checkout.
   *
   * Nothing downstream could tell them apart — a redemption resolves by code,
   * so a duplicate silently gives one of the two campaigns the other's
   * ceiling. It was unstoppable while every keystroke was a save, because
   * every prefix of an existing code is a duplicate on its way to being one.
   */
  const duplicate =
    code !== '' &&
    coupons.some((c) => c.id !== coupon.id && c.code.toUpperCase() === code.toUpperCase());
  const backwards = form.validTo < form.validFrom;

  const codeError = duplicate ? t('codeTaken') : undefined;
  const dateError = backwards ? t('datesBackwards') : undefined;
  const valid = code !== '' && !duplicate && !backwards;

  function patch(next: Partial<Draft>) {
    setForm({ ...form, ...next });
  }

  function save() {
    if (!valid) return;
    const record: Coupon = { ...coupon, ...form, code };

    if (isNew) {
      /* Length first, then the clock — `useNow` ticks every 30 seconds and the
         demo clock can be pinned outright, so a bare timestamp is not unique.
         Was `cpn_${coupons.length + 1}`, which collides the moment a coupon is
         removed and another written. */
      const id = `cpn_${coupons.length}_${now.getTime().toString(36).slice(-4)}`;
      patchData({ coupons: [...coupons, { ...record, id }] });
    } else {
      patchData({ coupons: coupons.map((c) => (c.id === coupon.id ? record : c)) });
    }

    toast.success(t(isNew ? 'created' : 'saved', { code }));
    router.push('/admin/gutscheine');
  }

  const remaining = couponRemaining({ ...coupon, ...form });

  return (
    <div>
      <PageHeader
        title={isNew ? t('newTitle') : coupon.code}
        back={{ href: '/admin/gutscheine', label: t('back') }}
        /*
         * The state, and the count it is derived from.
         *
         * Neither was on this screen. A coupon could be opened, edited and
         * saved with nothing on the page saying it had expired three weeks ago
         * or hit its ceiling yesterday — the two facts that decide whether the
         * edit is worth making. The badge reads from the *stored* record, not
         * the draft: it describes what is live right now, and changing a date
         * in the form has not made anything live yet.
         */
        meta={
          isNew ? undefined : <StatusBadge entity="coupon" state={couponState(coupon, now)} />
        }
        lead={
          isNew
            ? t('newLead')
            : coupon.maxUses === undefined
              ? t('usageUncapped', { used: coupon.usedCount })
              : t('usageCapped', { used: coupon.usedCount, max: coupon.maxUses })
        }
      />

      <div className="space-y-5">
        <Field label={t('codeLabel')} hint={t('codeHint')} error={codeError}>
          {(props) => (
            <Input
              value={form.code}
              onChange={(e) => patch({ code: e.target.value.toUpperCase() })}
              className="font-mono tracking-wide"
              autoCapitalize="characters"
              {...props}
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('kindLabel')}>
            {(props) => (
              <Select
                value={form.kind}
                onChange={(e) => patch({ kind: e.target.value as Coupon['kind'] })}
                {...props}
              >
                <option value="percent">{t('kindPercent')}</option>
                <option value="amount">{t('kindAmount')}</option>
              </Select>
            )}
          </Field>
          <Field label={form.kind === 'percent' ? '%' : 'CHF'}>
            {(props) => (
              <NumberField
                value={form.value}
                onCommit={(v) => patch({ value: v })}
                min={0}
                /* A percentage over 100 is the company paying the customer to
                   be cleaned for. The cap belongs on the control rather than
                   in a message, because there is no case where typing 150 here
                   meant anything. */
                max={form.kind === 'percent' ? 100 : undefined}
                {...props}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('validFrom')}>
            {(props) => (
              <Input
                type="date"
                value={form.validFrom.slice(0, 10)}
                onChange={(e) => patch({ validFrom: e.target.value })}
                {...props}
              />
            )}
          </Field>
          <Field label={t('validTo')} error={dateError}>
            {(props) => (
              <Input
                type="date"
                value={form.validTo.slice(0, 10)}
                onChange={(e) => patch({ validTo: e.target.value })}
                {...props}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('minOrderLabel')} optional>
            {(props) => (
              <Input
                type="number"
                inputMode="decimal"
                value={form.minOrder ?? ''}
                onChange={(e) =>
                  patch({ minOrder: e.target.value ? Number(e.target.value) : undefined })
                }
                {...props}
              />
            )}
          </Field>
          <Field
            label={t('maxUsesLabel')}
            /* On an existing coupon the ceiling is not an abstract number: it
               is being compared against a count that already happened, and
               lowering it below that count is what puts a live code into
               «aufgebraucht». Said here rather than discovered from the badge
               after saving. */
            hint={
              isNew || remaining === undefined
                ? t('maxUsesHint')
                : t('maxUsesRemaining', { n: remaining })
            }
            optional
          >
            {(props) => (
              <Input
                type="number"
                inputMode="numeric"
                value={form.maxUses ?? ''}
                onChange={(e) =>
                  patch({ maxUses: e.target.value ? Number(e.target.value) : undefined })
                }
                {...props}
              />
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="label-type text-ink-secondary">{t('servicesLabel')}</legend>
          <p className="mt-1 text-sm text-ink-tertiary">
            {form.services.length === 0 ? t('servicesAll') : null}
          </p>
          <div className="mt-3 space-y-2.5">
            {services.map((s) => (
              <Checkbox
                key={s.id}
                label={s.name[locale]}
                checked={form.services.includes(s.slug)}
                onChange={(e) =>
                  patch({
                    services: e.target.checked
                      ? [...form.services, s.slug]
                      : form.services.filter((x) => x !== s.slug),
                  })
                }
              />
            ))}
          </div>
        </fieldset>

        <Checkbox
          label={t('activeLabel')}
          /*
             A checkbox here, a switch on the list, and the same field behind
             both — which is the split rather than a drift.

             On the list the flip is the whole action: nothing else is in
             flight and the same click puts it back, so it applies at once and
             says so. Here it sits in a draft next to a half-typed code and a
             date nobody has committed to. Applying it on its own would publish
             one decision out of a record the reader can still see is
             unfinished — the office would pull a code and leave the dates it
             was pulled in favour of unsaved beside it. */
          checked={form.active}
          onChange={(e) => patch({ active: e.target.checked })}
        />
      </div>

      {/*
        The save row, always present.

        Screen 75b shows its equivalent only once a field changes, because the
        switch beside it writes on its own and the button's arrival is what
        marks the difference. Nothing on this screen writes on its own any
        more, so there is no difference to mark — and a form that saves on a
        button and shows no button until you have already typed into it makes
        the reader find that out by typing. Disabled until there is something
        to save says the same thing without the experiment.
      */}
      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line-subtle pt-6">
        <Button size="lg" onClick={save} disabled={!valid || (!isNew && !dirty)}>
          {t('save')}
        </Button>
        {isNew ? (
          <Button asChild variant="ghost" size="lg">
            <Link href="/admin/gutscheine">{t('cancel')}</Link>
          </Button>
        ) : (
          dirty && (
            <Button variant="ghost" size="lg" onClick={() => setForm(draftOf(coupon))}>
              {t('discard')}
            </Button>
          )
        )}
        {!isNew && dirty && (
          <p className="max-w-[var(--measure)] text-sm text-ink-tertiary">{t('unsaved')}</p>
        )}
      </div>

      {/* The stacking rule again, on the screen where the number is typed. It
          is on the list too, and that is not a duplication to remove: the list
          is where the office reads it before deciding, this is where it reads
          it while setting a figure that a plan discount may swallow whole. */}
      <p className="mt-6 max-w-[var(--measure)] text-sm text-ink-tertiary">
        {listT('stackingNote')}
      </p>
    </div>
  );
}
