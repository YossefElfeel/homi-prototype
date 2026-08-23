import { ArrowRight, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

import type { Theme } from '@/lib/theme';
import { CtaBand as LandingCtaBand } from '@/components/landing/CtaBand';

/**
 * SIGNATURE COMPONENT — the closing ask.
 *
 * No countdown, no discount, no scarcity. This audience reads those as cheap
 * (team brief §2.1), so the band earns the click by restating what happens
 * next instead of applying pressure.
 */
export function CtaBand({ theme }: { theme: Theme }) {
  const t = useTranslations('site.home.finalCta');
  const brand = useTranslations('brand');
  const phone = brand('phone');

  /* The cloned design ships its own closing band — the same one the homepage
     uses, so every page in this direction ends the same way. */
  if (theme === 'homivaro') return <LandingCtaBand />;

  if (theme === 'goldkueste') {
    return (
      <section className="bg-inverse text-ink-inverse">
        <div className="mx-auto max-w-3xl px-gutter py-section text-center">
          <span aria-hidden className="mx-auto block h-px w-14 bg-rule" />
          <h2 className="display-type mt-8 text-[clamp(1.875rem,4vw,3rem)]">{t('title')}</h2>
          <p className="mx-auto mt-6 max-w-[52ch] text-lg text-ink-inverse-secondary">
            {t('lead')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <Button
              asChild
              size="lg"
              className="bg-white text-[var(--brand-navy-900)] hover:bg-white/88"
            >
              <Link href="/anfrage">
                {t('primary')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 border-b border-white/35 pb-1 text-sm text-white/80 transition-colors hover:border-white hover:text-white"
            >
              <Phone className="size-4" aria-hidden />
              <span data-numeric>{phone}</span>
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (theme === 'zuhause') {
    return (
      <section className="px-gutter py-section">
        <div className="mx-auto max-w-5xl rounded-[var(--radius-xl)] bg-accent-subtle px-8 py-14 text-center shadow-[var(--shadow-md)] sm:px-14">
          <h2 className="display-type text-[clamp(1.75rem,3.6vw,2.75rem)]">{t('title')}</h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-lg text-ink-secondary">{t('lead')}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/anfrage">
                {t('primary')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href={`tel:${phone.replace(/\s/g, '')}`}>
                <Phone className="size-4" aria-hidden />
                <span data-numeric>{phone}</span>
              </a>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-line-strong">
      <div className="mx-auto grid max-w-7xl gap-8 px-gutter py-section lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h2 className="display-type text-[clamp(1.875rem,4vw,3rem)]">{t('title')}</h2>
          <span aria-hidden className="mt-5 block h-0.5 w-12 bg-rule" />
          <p className="mt-6 max-w-[52ch] text-lg text-ink-secondary">{t('lead')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end">
          <Button asChild size="lg">
            <Link href="/anfrage">
              {t('primary')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href={`tel:${phone.replace(/\s/g, '')}`}>
              <Phone className="size-4" aria-hidden />
              <span data-numeric>{phone}</span>
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
