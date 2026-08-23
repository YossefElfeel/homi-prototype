import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Clock, Mail, MessageCircle, Phone } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getTheme } from '@/lib/theme-server';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
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
      {hv ? <Masthead lines={d.raw('lines')} lead={t('lead')} /> : null}

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
          <div className="border-l-2 border-rule bg-sunken p-5">
            <h2 className="font-medium">{t('quoteHintTitle')}</h2>
            <p className="mt-1.5 text-sm text-ink-secondary">{t('quoteHintBody')}</p>
            <Button asChild variant="link" className="mt-3">
              <Link href="/anfrage">
                {t('quoteHintCta')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>

          <dl className="mt-8 divide-y divide-line-subtle border-y border-line-subtle">
            <ContactRow icon={Phone} label={t('phoneLabel')}>
              <a
                href={`tel:${brand('phone').replace(/\s/g, '')}`}
                data-numeric
                className="transition-colors hover:text-ink-accent"
              >
                {brand('phone')}
              </a>
            </ContactRow>
            <ContactRow icon={MessageCircle} label={t('mobileLabel')}>
              <a
                href={`https://wa.me/41${brand('mobile').replace(/\D/g, '').replace(/^0/, '')}`}
                data-numeric
                className="transition-colors hover:text-ink-accent"
              >
                {brand('mobile')}
              </a>
            </ContactRow>
            <ContactRow icon={Mail} label={t('emailLabel')}>
              <a
                href={`mailto:${brand('email')}`}
                className="transition-colors hover:text-ink-accent"
              >
                {brand('email')}
              </a>
            </ContactRow>
            <ContactRow icon={Clock} label={t('hoursLabel')}>
              {footer('hours')}
            </ContactRow>
          </dl>

          <h2 className="label-type mt-10 text-ink-tertiary">{t('areasTitle')}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {SERVED_REGIONS.map((region) => (
              <li key={region.slug} className="text-sm text-ink-secondary">
                {region.name}
                <span data-numeric className="ml-1.5 text-ink-tertiary">
                  {region.postcode}
                </span>
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

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <dt className="flex items-center gap-2.5 text-sm text-ink-secondary">
        <Icon className="size-4 shrink-0 text-ink-tertiary" aria-hidden />
        {label}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
