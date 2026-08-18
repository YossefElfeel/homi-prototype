'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Field, Input, NumberField, Select, Checkbox } from '@/components/ui/field';
import { useHydrated, useNow, useStore } from '@/mock/store';
import type { Coupon, ServiceSlug } from '@/mock/schema';

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Screen 77 — creating or editing a coupon.
 *
 * `/admin/gutscheine/neu` opens the same form empty. One route, one layout: a
 * separate "new" screen would drift from the edit screen within a month.
 */
export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.coupon');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const now = useNow();

  const coupons = useStore((s) => s.data.coupons);
  const services = useStore((s) => s.services);
  const patchData = useStore((s) => s.patchData);

  const isNew = id === 'neu';
  const [pending, setPending] = useState<Coupon | null>(null);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const existing = coupons.find((c) => c.id === id);
  const coupon: Coupon =
    pending ??
    existing ?? {
      id: `cpn_${coupons.length + 1}`,
      code: '',
      kind: 'percent',
      value: 10,
      services: [],
      validFrom: isoDate(now),
      validTo: isoDate(new Date(now.getTime() + 90 * 86_400_000)),
      usedCount: 0,
      active: true,
    };

  function patch(next: Partial<Coupon>) {
    const merged = { ...coupon, ...next };
    setPending(merged);
    if (!isNew) {
      patchData({ coupons: coupons.map((c) => (c.id === coupon.id ? merged : c)) });
    }
  }

  function save() {
    if (isNew) patchData({ coupons: [...coupons, coupon] });
    router.push('/admin/gutscheine');
  }

  return (
    <div>
      <Button asChild variant="link" className="mb-6">
        <Link href="/admin/gutscheine">
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <h1 className="display-type text-3xl">{isNew ? t('newTitle') : coupon.code}</h1>

      <div className="mt-8 space-y-5">
        <Field label={t('codeLabel')} hint={t('codeHint')}>
          {(props) => (
            <Input
              value={coupon.code}
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
                value={coupon.kind}
                onChange={(e) => patch({ kind: e.target.value as Coupon['kind'] })}
                {...props}
              >
                <option value="percent">{t('kindPercent')}</option>
                <option value="amount">{t('kindAmount')}</option>
              </Select>
            )}
          </Field>
          <Field label={coupon.kind === 'percent' ? '%' : 'CHF'}>
            {(props) => (
              <NumberField
                value={coupon.value}
                onCommit={(v) => patch({ value: v })}
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
                value={coupon.validFrom.slice(0, 10)}
                onChange={(e) => patch({ validFrom: e.target.value })}
                {...props}
              />
            )}
          </Field>
          <Field label={t('validTo')}>
            {(props) => (
              <Input
                type="date"
                value={coupon.validTo.slice(0, 10)}
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
                value={coupon.minOrder ?? ''}
                onChange={(e) =>
                  patch({ minOrder: e.target.value ? Number(e.target.value) : undefined })
                }
                {...props}
              />
            )}
          </Field>
          <Field label={t('maxUsesLabel')} hint={t('maxUsesHint')} optional>
            {(props) => (
              <Input
                type="number"
                inputMode="numeric"
                value={coupon.maxUses ?? ''}
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
            {coupon.services.length === 0 ? t('servicesAll') : null}
          </p>
          <div className="mt-3 space-y-2.5">
            {services.map((s) => (
              <Checkbox
                key={s.id}
                label={s.name[locale]}
                checked={coupon.services.includes(s.slug)}
                onChange={(e) =>
                  patch({
                    services: e.target.checked
                      ? [...coupon.services, s.slug as ServiceSlug]
                      : coupon.services.filter((x) => x !== s.slug),
                  })
                }
              />
            ))}
          </div>
        </fieldset>

        <Checkbox
          label={t('activeLabel')}
          checked={coupon.active}
          onChange={(e) => patch({ active: e.target.checked })}
        />
      </div>

      <div className="mt-10 border-t border-line-subtle pt-6">
        <Button onClick={save} disabled={!coupon.code.trim()}>
          {t('save')}
        </Button>
      </div>
    </div>
  );
}
