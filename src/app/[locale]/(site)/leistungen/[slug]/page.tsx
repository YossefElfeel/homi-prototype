import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, Check, ChevronRight, ShieldCheck, X } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getStressMode, getTheme } from '@/lib/theme-server';
import { getServiceContent } from '@/content/services';
import { SEED_ADDONS, SEED_SERVICES, SEED_SETTINGS } from '@/mock/seed';
import { durationRange } from '@/mock/engines/pricing';
import type { ServiceSlug } from '@/mock/schema';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { Faq } from '@/components/ui/accordion';
import { CtaBand } from '@/components/signature/cta-band';
import { Section, SectionHeading } from '@/components/signature/section-heading';
import { Masthead } from '@/components/landing/Masthead';
import { formatChf } from '@/components/ui/money';

/** The three photographs the design shipped, on the services they show. */
const SERVICE_PHOTO: Partial<Record<string, string>> = {
  unterhaltsreinigung: '/img/service-1.webp',
  umzugsreinigung: '/img/service-2.webp',
  moebelmontage: '/img/service-3.webp',
};
import { SERVICE_ICONS, serviceFromPrice } from '@/components/site/service-grid';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SEED_SERVICES.map((service) => ({ locale, slug: service.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = SEED_SERVICES.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: service.name[locale as Locale],
    description: service.short[locale as Locale],
  };
}

/**
 * Screen 2 — the service template. One layout, seven services.
 *
 * The "what is not included" block is not filler. The brief: it prevents half
 * the disputes before they happen, and it is the section most likely to be
 * cut for looking negative. It stays.
 */
export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const service = SEED_SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  const [theme, stressed] = await Promise.all([getTheme(), getStressMode()]);
  const t = await getTranslations('site.services');
  const nav = await getTranslations('nav');
  const content = getServiceContent(slug as ServiceSlug, locale as Locale, stressed);

  const Icon = SERVICE_ICONS[service.slug];
  const range = durationRange(service.durationProfile);
  const addOns = SEED_ADDONS.filter((a) => a.services.includes(service.slug));
  const related = SEED_SERVICES.filter((s) => s.active && s.slug !== service.slug).slice(0, 3);

  const pricing = await getTranslations('site.pricing');
  const hv = theme === 'homivaro';
  const photo = SERVICE_PHOTO[service.slug];

  /*
   * This is the one interior page that earns a photograph, and only for the
   * three services one exists for — the page is *about* the thing in the
   * picture. The other four open on type alone rather than borrowing an image
   * of a different job.
   *
   * The service name is the whole heading, so it takes the navy `lead` slot
   * with no red half: there is nothing here to split, and inventing a split
   * would put the accent on an arbitrary syllable of a compound noun.
   */
  const masthead = hv ? (
    <Masthead
      lines={[{ lead: service.name[locale as Locale] }]}
      lead={content.lead}
      action={{ label: t('cta'), href: `/anfrage?leistung=${service.slug}` }}
      image={photo ? { src: photo, alt: service.name[locale as Locale] } : undefined}
      stats={[
        {
          label: t('fromLabel'),
          value: formatChf(serviceFromPrice(service.minDuration), locale as Locale),
        },
        ...(range ? [{ label: t('durationLabel'), value: `${range[0]}–${range[1]} h` }] : []),
        {
          label: pricing('minimumLabel'),
          value: `${Math.max(service.minDuration, SEED_SETTINGS.minimumHours)} h`,
        },
      ]}
    />
  ) : null;

  return (
    <>
      <div className="border-b border-line-subtle">
        <div className="mx-auto max-w-7xl px-gutter py-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-tertiary">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <ChevronRight className="size-3.5" aria-hidden />
              <li>
                <Link href="/leistungen" className="transition-colors hover:text-ink">
                  {nav('services')}
                </Link>
              </li>
              <ChevronRight className="size-3.5" aria-hidden />
              <li aria-current="page" className="text-ink">
                {service.name[locale as Locale]}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {masthead}

      {/* The old opening block carries an h1 of its own, so it is removed
          outright rather than hidden — two h1s in the document is no outline
          at all, even when one of them is display:none. */}
      {!hv ? (
      <div className="border-b border-line-subtle">
        <div className="mx-auto grid max-w-7xl gap-10 px-gutter py-14 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <Icon className="size-7 text-ink-accent" aria-hidden />
            <h1 className="display-type mt-5 text-[clamp(2rem,5vw,3.5rem)]">
              {service.name[locale as Locale]}
            </h1>
            <span aria-hidden className="mt-6 block h-0.5 w-12 bg-rule" />
            <p className="mt-6 max-w-[46ch] text-lg text-ink-secondary">{content.lead}</p>

            {service.handoverGuarantee && (
              <p className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-status-success px-3 py-2 text-sm text-status-success-fg">
                <ShieldCheck className="size-4" aria-hidden />
                {t('guaranteeBadge')}
              </p>
            )}

            <div className="mt-9">
              <Button asChild size="lg">
                <Link href={`/anfrage?leistung=${service.slug}`}>
                  {t('cta')}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          <dl className="divide-y divide-line-subtle border-y border-line-subtle lg:col-span-5 lg:self-start">
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-sm text-ink-secondary">{t('fromLabel')}</dt>
              <dd className="text-lg">
                <Money amount={serviceFromPrice(service.minDuration)} emphasis="strong" />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-sm text-ink-secondary">Stundensatz</dt>
              <dd>
                <Money amount={SEED_SETTINGS.hourlyRate} per="hour" />
              </dd>
            </div>
            {range && (
              <div className="flex items-baseline justify-between gap-4 py-4">
                <dt className="text-sm text-ink-secondary">{t('durationLabel')}</dt>
                <dd data-numeric>
                  {range[0]}–{range[1]} h
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-sm text-ink-secondary">Mindestbezug</dt>
              <dd data-numeric>
                {Math.max(service.minDuration, SEED_SETTINGS.minimumHours)} h
              </dd>
            </div>
          </dl>
        </div>
      </div>
      ) : null}

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="subhead-type text-2xl">{t('includedTitle')}</h2>
            <ul className="mt-6 space-y-3">
              {content.included.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-1 size-4 shrink-0 text-eco" aria-hidden />
                  <span className="text-ink-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="subhead-type text-2xl">{t('notIncludedTitle')}</h2>
            <p className="mt-3 max-w-[var(--measure)] text-sm text-ink-secondary">
              {t('notIncludedLead')}
            </p>
            <ul className="mt-6 space-y-3">
              {content.notIncluded.map((item) => (
                <li key={item} className="flex gap-3">
                  <X className="mt-1 size-4 shrink-0 text-ink-tertiary" aria-hidden />
                  <span className="text-ink-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {addOns.length > 0 && (
        <Section tone="sunken">
          <SectionHeading theme={theme} title={t('addOnsTitle')} align="start" />
          <ul className="mt-8 grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-2 lg:grid-cols-3">
            {addOns.map((addOn) => (
              <li key={addOn.slug} className="bg-page p-6">
                <h3 className="font-medium">{addOn.name[locale as Locale]}</h3>
                <p className="mt-1.5 text-sm text-ink-secondary">
                  {addOn.short[locale as Locale]}
                </p>
                <p className="mt-4 flex items-baseline justify-between border-t border-line-subtle pt-3">
                  <Money amount={addOn.price} />
                  <span data-numeric className="text-sm text-ink-tertiary">
                    +{addOn.extraDuration} h
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section>
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="subhead-type text-2xl">{t('calcTitle')}</h2>
            <p className="mt-4 max-w-[var(--measure)] text-ink-secondary">{t('calcBody')}</p>
            <Button asChild variant="link" className="mt-5">
              <Link href="/preise">
                Alle Preise ansehen
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <div className="lg:col-span-7">
            <h2 className="subhead-type text-2xl">{t('faqTitle')}</h2>
            <Faq items={content.faq} className="mt-6" />
          </div>
        </div>
      </Section>

      <Section tone="sunken">
        <SectionHeading theme={theme} title={t('relatedTitle')} align="start" />
        <ul className="mt-8 grid gap-px border border-line-subtle bg-line-subtle sm:grid-cols-3">
          {related.map((other) => {
            const OtherIcon = SERVICE_ICONS[other.slug];
            return (
              <li key={other.slug} className="bg-page">
                <Link
                  href={`/leistungen/${other.slug}`}
                  className="flex h-full flex-col p-6 transition-colors hover:bg-accent-subtle"
                >
                  <OtherIcon className="size-5 text-ink-accent" aria-hidden />
                  <h3 className="mt-4 font-medium">{other.name[locale as Locale]}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink-secondary">
                    {other.short[locale as Locale]}
                  </p>
                  <p className="mt-4">
                    <Money amount={serviceFromPrice(other.minDuration)} from />
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <CtaBand theme={theme} />
    </>
  );
}
