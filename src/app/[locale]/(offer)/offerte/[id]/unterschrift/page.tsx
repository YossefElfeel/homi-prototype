'use client';

import { use, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormatter } from '@/i18n/format';
import { ArrowRight, RotateCcw } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { Checkbox } from '@/components/ui/field';
import { OfferShell } from '@/components/offer/offer-shell';
import { HoldTimer } from '@/components/offer/hold-timer';
import { useOffer } from '@/components/offer/use-offer';
import { offerTotal } from '@/mock/engines/offers';
import { useHydrated, useNow, useStore } from '@/mock/store';

/**
 * Screen 26 — the electronic signature (§9.2).
 *
 * Distinct from §21 item 9, which removed signatures from *proof of work*. The
 * signature on the quote stays: it is what turns a price into an agreement.
 *
 * The three facts being signed for sit next to the pad, not above the fold
 * somewhere — nobody should have to scroll to check what they are agreeing to.
 */
export default function SignaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('offer.sign');
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();

  const data = useOffer(id);
  const signOffer = useStore((s) => s.signOffer);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [accepted, setAccepted] = useState(false);

  if (!hydrated) return <div className="p-gutter text-ink-tertiary">…</div>;
  if (!data) return null;
  const { offer, service, hold } = data;

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = point(event);
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--content-primary')
      .trim();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
    canvasRef.current!.setPointerCapture(event.pointerId);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasSignature(true);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  function proceed() {
    signOffer(offer.id, now);
    router.push(`/offerte/${offer.id}/zahlung`);
  }

  return (
    <OfferShell offer={offer} step="unterschrift">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="display-type text-[clamp(1.75rem,3.6vw,2.75rem)]">{t('title')}</h1>
          <p className="mt-4 max-w-[46ch] text-ink-secondary">{t('lead')}</p>

          <div className="mt-8">
            <p className="label-type text-ink-tertiary">{t('canvasLabel')}</p>
            <canvas
              ref={canvasRef}
              width={720}
              height={220}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              aria-label={t('canvasLabel')}
              className="mt-2 w-full touch-none rounded-[var(--radius-lg)] border border-dashed border-line bg-card"
              style={{ aspectRatio: '720 / 220' }}
            />
            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-sm text-ink-tertiary">{t('canvasHint')}</p>
              <Button variant="ghost" size="sm" onClick={clear} disabled={!hasSignature}>
                <RotateCcw className="size-3.5" aria-hidden />
                {t('clear')}
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <Checkbox
              label={t('confirm')}
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
          </div>

          <Button
            size="lg"
            className="mt-8"
            onClick={proceed}
            disabled={!hasSignature || !accepted}
          >
            {t('continue')}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
          {!hasSignature && (
            <p className="mt-3 text-sm text-ink-tertiary">{t('required')}</p>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-6 space-y-5">
            {hold && <HoldTimer hold={hold} />}
            <dl className="surface-card divide-y divide-line-subtle p-6">
              <div className="flex items-baseline justify-between gap-4 pb-3">
                <dt className="text-sm text-ink-secondary">{t('summaryService')}</dt>
                <dd className="text-right">{service.name[locale]}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-sm text-ink-secondary">{t('summaryDate')}</dt>
                <dd data-numeric className="text-right">
                  {hold
                    ? `${format.dateTime(new Date(hold.start), 'dayMonth')}, ${format.dateTime(new Date(hold.start), 'time')}`
                    : '—'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-3">
                <dt className="text-sm text-ink-secondary">{t('summaryAmount')}</dt>
                <dd>
                  <Money amount={offerTotal(offer)} emphasis="strong" />
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </OfferShell>
  );
}
