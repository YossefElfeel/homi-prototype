import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Clock, Mail, MessageCircle, Phone } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { SEED_SETTINGS } from '@/mock/seed';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { ContactForm } from '@/components/site/contact-form';
import { Masthead } from '@/components/landing/Masthead';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site.contact' });
  return { title: t('meta.title'), description: t('lead') };
}

/**
 * Screen 8 — contact.
 *
 * The routing hint sits above the form on purpose. Someone who wants a price
 * is in the wrong place here, and sending them to the request flow saves the
 * owner a round trip — the whole reason this system exists.
 */
export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const theme = await getTheme();
  const t = await getTranslations('site.contact');
  const brand = await getTranslations('brand');
  const footer = await getTranslations('footer');

  const d = await getTranslations('site.display.contact');
  const hv = theme === 'homivaro';

  return (
    <>
      {hv ? (
        /* The two facts somebody about to write to a stranger wants: how long
           before anyone answers, and whether we come to them at all. Both read
           from settings rather than written here, and both were absent — the
           masthead's fact column was bare navy on the one page whose subject
           is being reachable. */
        <Masthead
          lines={d.raw('lines')}
          lead={t('lead')}
          stats={[
            { value: `${SEED_SETTINGS.responseTimeHours} h`, label: t('factResponse') },
            { value: String(SERVED_REGIONS.length), label: t('factRegions') },
          ]}
        />
      ) : null}

    <Section>
      {!hv ? (
        <SectionHeading
          theme={theme}
          eyebrow={t('eyebrow')}
          title={t('title')}
          lead={t('lead')}
          align="start"
          level={1}
        />
      ) : null}

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          {/*
           * The three ways to reach a person, as three cards you can hit.
           *
           * They were four rows of a hairline `dl` with the label on the left
           * and the number set small on the right — on the one page whose
           * entire subject is "how do I reach you", the phone number was the
           * quietest thing on it, and the tap target on a phone was the width
           * of the digits. A contact method is an action; it gets the size of
           * one.
           */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {(
              [
                {
                  key: 'phone',
                  icon: Phone,
                  label: t('phoneLabel'),
                  value: brand('phone'),
                  href: `tel:${brand('phone').replace(/\s/g, '')}`,
                  numeric: true,
                },
                {
                  key: 'mobile',
                  icon: MessageCircle,
                  label: t('mobileLabel'),
                  value: brand('mobile'),
                  href: `https://wa.me/41${brand('mobile').replace(/\D/g, '').replace(/^0/, '')}`,
                  numeric: true,
                },
                {
                  key: 'email',
                  icon: Mail,
                  label: t('emailLabel'),
                  value: brand('email'),
                  href: `mailto:${brand('email')}`,
                  numeric: false,
                },
              ] as const
            ).map(({ key, icon: Icon, label, value, href, numeric }) => (
              <li key={key}>
                <a
                  href={href}
                  className="surface-card group flex items-center gap-4 p-5 transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-focus"
                >
                  <span className="bg-accent-subtle text-ink-accent grid size-11 shrink-0 place-items-center rounded-full">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="label-type block text-ink-tertiary">{label}</span>
                    <span
                      data-numeric={numeric || undefined}
                      className="mt-1 block truncate text-lg transition-colors group-hover:text-ink-accent"
                    >
                      {value}
                    </span>
                  </span>
                  <ArrowRight
                    className="ml-auto size-4 shrink-0 text-ink-tertiary transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>

          {/* Hours are not a way to reach anyone, so they are not a fourth
              card — they are the condition on the three above. */}
          <p className="mt-4 flex items-center gap-2.5 text-sm text-ink-secondary">
            <Clock className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
            <span>
              {t('hoursLabel')}: {footer('hours')}
            </span>
          </p>

          <div className="mt-8 border-l-2 border-rule bg-sunken rounded-[var(--radius-lg)] p-5">
            <h2 className="font-medium">{t('quoteHintTitle')}</h2>
            <p className="mt-1.5 text-sm text-ink-secondary">{t('quoteHintBody')}</p>
            <Button asChild variant="link" className="mt-3">
              <Link href="/anfrage">
                {t('quoteHintCta')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>

          <h2 className="label-type mt-10 text-ink-tertiary">{t('areasTitle')}</h2>
          {/* Linked, as they are on /ueber-uns. Each municipality has its own
              route and this page listed all eight as dead text — the one page
              a visitor lands on to ask "do you come to me" sent them nowhere
              to find out. */}
          <ul className="mt-3 flex flex-wrap gap-2">
            {SERVED_REGIONS.map((region) => (
              <li key={region.slug}>
                <Link
                  href={`/gebiete/${region.slug}`}
                  className="border-line inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors hover:border-line-strong hover:bg-sunken"
                >
                  {region.name}
                  <span data-numeric className="text-ink-tertiary">
                    {region.postcode}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </Section>
    </>
  );
}

