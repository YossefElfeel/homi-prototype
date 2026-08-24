import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Money } from '@/components/ui/money';
import { SERVICE_ICONS, serviceFromPrice } from '@/components/site/service-grid';
import { SEED_SERVICES } from '@/mock/seed';
import { cn } from '@/lib/cn';

/**
 * Guide prices, one row per service.
 *
 * This was a three-column `<table>` standing bare on the section's grey slab,
 * ruled in `border-line-subtle` — #e4e4e4 on #f1f1f1. Every rule in it was
 * invisible, its `hv-row` hover painted `surface-sunken` onto a surface that
 * was already `surface-sunken`, and the service names were links that gave no
 * sign of being links. A price list nobody can see the rows of is a price list
 * nobody reads, and this is the page where a visitor decides whether to ask.
 *
 * It is a list of rows now rather than a table, because it never was tabular
 * data: each row is one service and its own price, with nothing to compare
 * across columns. That also lets the whole row be the link — the target was a
 * few words of text before, on a page whose next step is opening a service.
 *
 * The short description carries its weight here: "billed per window" is the
 * answer to the question the method column was gesturing at.
 */
export async function PriceList({
  locale,
  /** The display face for prices — the homivaro direction sets numerals in Bebas. */
  display = false,
}: {
  locale: Locale;
  display?: boolean;
}) {
  const t = await getTranslations('site.pricing');
  const services = SEED_SERVICES.filter((s) => s.active).sort((a, b) => a.order - b.order);

  return (
    <ul className="surface-card divide-y divide-line overflow-hidden">
      {services.map((service) => {
        const Icon = SERVICE_ICONS[service.slug];

        return (
          <li key={service.slug}>
            <Link
              href={`/leistungen/${service.slug}`}
              className="group flex items-center gap-5 p-5 transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-focus sm:gap-6 sm:p-6"
            >
              <span className="bg-accent-subtle text-ink-accent grid size-11 shrink-0 place-items-center rounded-full">
                <Icon className="size-5" aria-hidden />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-medium transition-colors group-hover:text-ink-accent">
                  {service.name[locale]}
                </span>
                <span className="mt-1 block text-sm text-ink-secondary">
                  {service.short[locale]}
                </span>
              </span>

              <span className="hidden shrink-0 text-sm text-ink-tertiary sm:block">
                {service.calc === 'perUnit' ? t('methodPerUnit') : t('methodHourly')}
              </span>

              <span
                className={cn(
                  'shrink-0 text-right',
                  display
                    ? // Money sets its "ab"/"from" prefix in tertiary grey, which
                      // is right beside body copy and too quiet beside a 36px
                      // numeral. Lifted with the figure it qualifies.
                      'display-type text-[32px] leading-none sm:text-[36px] [&_span]:text-ink-secondary'
                    : 'text-xl',
                )}
              >
                <Money amount={serviceFromPrice(service.minDuration)} from />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
