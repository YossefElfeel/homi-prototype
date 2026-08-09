'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, Send } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { offerTotal } from '@/mock/engines/offers';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

const CHANNELS = ['channelEmail', 'channelSms', 'channelWhatsapp'] as const;

/**
 * Screen 55 — preview and send.
 *
 * §8.3: sending the first quote is what creates the customer's account, and
 * the activation link travels with it. That is stated on the confirmation
 * rather than left to happen invisibly — the owner should know an account now
 * exists in the customer's name.
 */
export default function SendOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.preview');
  const locale = useLocale() as Locale;
  const now = useNow();
  const hydrated = useHydrated();

  const requests = useStore((s) => s.data.requests);
  const offers = useStore((s) => s.data.offers);
  const customers = useStore((s) => s.data.customers);
  const services = useStore((s) => s.services);
  const sendOffer = useStore((s) => s.sendOffer);

  const [channels, setChannels] = useState<string[]>(['channelEmail', 'channelWhatsapp']);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const request = requests.find((r) => r.id === id);
  const offer = offers.find(
    (o) => o.requestId === id && (o.status === 'draft' || o.status === 'sent'),
  );
  if (!request || !offer) return <p className="text-ink-tertiary">—</p>;

  const customer = customers.find((c) => c.id === request.customerId)!;
  const service = services.find((s) => s.slug === request.serviceSlug)!;
  const waiting = requests
    .filter((r) => r.id !== id && (r.status === 'new' || r.status === 'inReview'))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

  function send() {
    setState('sending');
    window.setTimeout(() => {
      sendOffer(offer!.id, now);
      setState('sent');
    }, 900);
  }

  if (state === 'sent') {
    return (
      <div className="max-w-2xl">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-status-success text-status-success-fg">
          <Check className="size-6" aria-hidden />
        </span>
        <h1 className="display-type mt-7 text-3xl">{t('sentTitle')}</h1>
        <p className="mt-4 text-lg text-ink-secondary">
          {t('sentBody', {
            name: `${customer.firstName} ${customer.lastName}`,
            channels: channels.map((c) => t(c as (typeof CHANNELS)[number])).join(', '),
          })}
        </p>
        <p className="mt-3 text-sm text-ink-secondary">
          {t('sentAccount', { name: customer.firstName })}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {waiting && (
            <Button asChild>
              <Link href={`/admin/anfragen/${waiting.id}`}>
                {t('nextRequest')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          )}
          <Button asChild variant="secondary">
            <Link href="/admin">{t('toDashboard')}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/offerte/${offer.id}`}>
              <ExternalLink className="size-4" aria-hidden />
              {t('openPreview')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <Button asChild variant="link" className="mb-6">
        <Link href={`/admin/anfragen/${id}/offerte`}>
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
      </Button>

      <h1 className="display-type text-3xl">{t('title')}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="display-type text-xl">{t('channelsTitle')}</h2>
          <p className="mt-1 text-sm text-ink-secondary">{t('channelHint')}</p>
          <ul className="mt-4 space-y-2">
            {CHANNELS.map((channel) => {
              const active = channels.includes(channel);
              return (
                <li key={channel}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border p-3.5 transition-colors',
                      active ? 'border-line-strong bg-accent-subtle' : 'border-line hover:bg-sunken',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() =>
                        setChannels((cs) =>
                          cs.includes(channel)
                            ? cs.filter((c) => c !== channel)
                            : [...cs, channel],
                        )
                      }
                      className="size-4 accent-[var(--accent-solid)]"
                    />
                    {t(channel)}
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="display-type text-xl">{t('previewTitle')}</h2>
          <div className="surface-card mt-4 p-5">
            <p data-numeric className="label-type text-ink-tertiary">
              {offer.reference}
            </p>
            <p className="mt-2 font-medium">
              {customer.firstName} {customer.lastName}
            </p>
            <p className="text-sm text-ink-secondary">{service.name[locale]}</p>
            <p className="mt-4 border-t border-line-subtle pt-3 text-2xl">
              <Money amount={offerTotal(offer)} emphasis="strong" />
            </p>
            <Button asChild variant="link" className="mt-4">
              <Link href={`/offerte/${offer.id}`}>
                <ExternalLink className="size-4" aria-hidden />
                {t('openPreview')}
              </Link>
            </Button>
          </div>
        </section>
      </div>

      <Button
        size="lg"
        className="mt-10"
        onClick={send}
        disabled={channels.length === 0 || state === 'sending'}
      >
        {state === 'sending' ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t('sending')}
          </>
        ) : (
          <>
            {t('send')}
            <Send className="size-4" aria-hidden />
          </>
        )}
      </Button>
    </div>
  );
}
