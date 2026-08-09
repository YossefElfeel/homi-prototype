'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Check, MessageCircle } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useStore } from '@/mock/store';

/**
 * Screen 22, second state — the receipt.
 *
 * Carries the two things someone needs the moment they let go of a request:
 * a reference they can quote, and a specific promise about when they will
 * hear back. Out-of-area requests say plainly that the answer may take longer
 * (§20.1) rather than letting the 24-hour promise quietly fail.
 */
export default function SentPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; aussergebiet?: string }>;
}) {
  const { ref, aussergebiet } = use(searchParams);
  const t = useTranslations('booking.sent');
  const rt = useTranslations('booking.review');
  const brand = useTranslations('brand');
  const settings = useStore((s) => s.settings);
  const customers = useStore((s) => s.data.customers);
  const currentCustomerId = useStore((s) => s.demo.currentCustomerId);

  const email = customers.find((c) => c.id === currentCustomerId)?.email ?? brand('email');
  const wa = brand('mobile').replace(/\D/g, '').replace(/^0/, '');

  return (
    <div className="mx-auto max-w-2xl px-gutter py-section">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-status-success text-status-success-fg">
        <Check className="size-6" aria-hidden />
      </span>

      <h1 className="display-type mt-7 text-[clamp(1.875rem,4vw,3rem)]">{t('title')}</h1>

      {ref && (
        <p className="mt-5 flex items-baseline gap-3">
          <span className="label-type text-ink-tertiary">{t('reference')}</span>
          <span data-numeric className="text-xl font-semibold">
            {ref}
          </span>
        </p>
      )}

      <p className="mt-5 text-lg text-ink-secondary">
        {t('lead', { hours: settings.responseTimeHours, email })}
      </p>

      {aussergebiet === '1' && (
        <div className="mt-7 flex gap-3 border-l-2 border-rule bg-sunken p-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ink-secondary" aria-hidden />
          <div>
            <h2 className="font-medium">{t('outOfAreaTitle')}</h2>
            <p className="mt-1.5 text-sm text-ink-secondary">{t('outOfAreaBody')}</p>
          </div>
        </div>
      )}

      <h2 className="label-type mt-12 text-ink-tertiary">{t('nextTitle')}</h2>
      <ol className="mt-4 divide-y divide-line-subtle border-y border-line-subtle">
        {[
          rt('after1'),
          rt('after2', { hours: settings.responseTimeHours }),
          rt('after3'),
        ].map((line, i) => (
          <li key={line} className="flex gap-4 py-4">
            <span data-numeric className="label-type pt-0.5 text-ink-tertiary">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-ink-secondary">{line}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <a href={`https://wa.me/41${wa}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" aria-hidden />
            {t('whatsapp')}
          </a>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    </div>
  );
}
