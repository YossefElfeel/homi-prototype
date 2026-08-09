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
 * The from-price is the honest floor: the two-hour minimum at the hourly rate,
 * or the service's own higher minimum. Not a marketing number — you can
 * actually buy a job at it.
 */
export function serviceFromPrice(minDuration: number) {
  return Math.max(minDuration, SEED_SETTINGS.minimumHours) * SEED_SETTINGS.hourlyRate;
}

export function ServiceGrid({ limit }: { limit?: number }) {
  const locale = useLocale() as Locale;
  const services = SEED_SERVICES.filter((s) => s.active)
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);

  return (
    <ul className="grid gap-px bg-line-subtle sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => {
        const Icon = SERVICE_ICONS[service.slug];
        return (
          <li key={service.slug} className="bg-page">
            <Link
              href={`/leistungen/${service.slug}`}
              className={cn(
                'group flex h-full flex-col p-7 transition-colors',
                'hover:bg-accent-subtle focus-visible:bg-accent-subtle',
              )}
            >
              <Icon className="size-6 text-ink-accent" aria-hidden />
              <h3 className="mt-5 text-lg font-medium">{service.name[locale]}</h3>
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
        );
      })}
    </ul>
  );
}
