import { ArrowUpRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import {
  Brush,
  Building2,
  Hammer,
  PackageOpen,
  Repeat,
  Sparkles,
  Wind,
} from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Money } from '@/components/ui/money';
import { SEED_SERVICES, SEED_SETTINGS } from '@/mock/seed';
import type { ServiceSlug } from '@/mock/schema';
import { isOffered } from '@/lib/service-catalogue';
import { cn } from '@/lib/cn';

/** SVG icons throughout — never emoji. */
export const SERVICE_ICONS: Record<ServiceSlug, typeof Brush> = {
  unterhaltsreinigung: Repeat,
  einmalreinigung: Brush,
  grundreinigung: Sparkles,
  umzugsreinigung: PackageOpen,
  fensterreinigung: Wind,
  bueroreinigung: Building2,
  moebelmontage: Hammer,
};

/**
 * The icon for a service, including one the map has never heard of.
 *
 * Five call sites indexed `SERVICE_ICONS` directly, which was safe only while
 * the catalogue was a closed set of seven. It is not any more: an owner can
 * add a service, and `SERVICE_ICONS[slug]` for a new one is `undefined` —
 * rendered as `<Icon />`, that is not a blank space but a React crash, and it
 * would take down the first step of the request flow.
 *
 * A component rather than a `serviceIcon(slug)` helper returning one, because
 * a component built from a call inside render is a new type on every pass:
 * React remounts it, and `react-hooks/static-components` refuses the build
 * over it. `Sparkles` is the fallback rather than a question mark — an
 * unrecognised service is a normal thing now, not an error to point at.
 * Choosing an icon per service is on /open-questions.
 */
export function ServiceIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = SERVICE_ICONS[slug as ServiceSlug] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}

/**
 * The from-price is the honest floor: the two-hour minimum at the hourly rate,
 * or the service's own higher minimum. Not a marketing number — you can
 * actually buy a job at it.
 */
export function serviceFromPrice(minDuration: number) {
  return Math.max(minDuration, SEED_SETTINGS.minimumHours) * SEED_SETTINGS.hourlyRate;
}

/**
 * `headingLevel` exists because the same grid appears under a section heading
 * on the homepage and directly under the page title on /leistungen. Leaving it
 * fixed at h3 skipped a level there, which is what a screen reader navigating
 * by heading actually trips over.
 */
export function ServiceGrid({
  limit,
  headingLevel = 3,
}: {
  limit?: number;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const locale = useLocale() as Locale;
  const services = SEED_SERVICES.filter(isOffered)
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);

  return (
    <ul className="grid gap-px bg-line-subtle sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
          <li key={service.slug} className="bg-page">
            <Link
              href={`/leistungen/${service.slug}`}
              className={cn(
                'group flex h-full flex-col p-7 transition-colors',
                'hover:bg-accent-subtle focus-visible:bg-accent-subtle',
              )}
            >
              <ServiceIcon slug={service.slug} className="size-6 text-ink-accent" />
              <Heading className="mt-5 text-lg font-medium">{service.name[locale]}</Heading>
              <p className="mt-2 flex-1 text-sm text-ink-secondary">
                {service.short[locale]}
              </p>
              <p className="mt-6 flex items-center justify-between border-t border-line-subtle pt-4">
                <Money amount={serviceFromPrice(service.minDuration)} from />
                <ArrowUpRight
                  className="size-4 text-ink-tertiary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </p>
            </Link>
          </li>
      ))}
    </ul>
  );
}
