import type { MetadataRoute } from 'next';

import { routing, TRANSLATED_LOCALES } from '@/i18n/routing';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { LEGAL_SLUGS } from '@/content/legal';
import { SEED_SERVICES } from '@/mock/seed';
import { isOffered } from '@/lib/service-catalogue';

const ORIGIN = 'https://homivaro.ch';

/**
 * The public routes, generated rather than listed.
 *
 * §6 makes the eight region pages the entire local SEO surface, and until now
 * nothing told a crawler they existed — they were reachable only by following
 * links from the footer. A sitemap generated from `SERVED_REGIONS` and
 * `SEED_SERVICES` also cannot drift: retire a service in the panel and it
 * leaves the sitemap with it, which a hand-kept list would not do.
 *
 * Only `de` and `en` are listed. French and Italian route and resolve, but
 * they resolve *to German* (§20.6) — submitting them as their own pages would
 * offer a search engine three URLs for one document.
 *
 * The console, the account area, the request flow and the offer links are all
 * deliberately absent: they are either private or single-use.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const services = SEED_SERVICES.filter(isOffered).sort((a, b) => a.order - b.order);

  const paths: { path: string; priority: number; frequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '', priority: 1, frequency: 'weekly' },
    { path: '/leistungen', priority: 0.9, frequency: 'monthly' },
    ...services.map((s) => ({
      path: `/leistungen/${s.slug}`,
      priority: 0.8,
      frequency: 'monthly' as const,
    })),
    { path: '/preise', priority: 0.9, frequency: 'monthly' },
    { path: '/abos', priority: 0.8, frequency: 'monthly' },
    { path: '/gebiete', priority: 0.8, frequency: 'monthly' },
    ...SERVED_REGIONS.map((r) => ({
      path: `/gebiete/${r.slug}`,
      priority: 0.8,
      frequency: 'monthly' as const,
    })),
    { path: '/referenzen', priority: 0.6, frequency: 'weekly' },
    { path: '/ueber-uns', priority: 0.6, frequency: 'yearly' },
    { path: '/kontakt', priority: 0.7, frequency: 'yearly' },
    { path: '/jobs', priority: 0.5, frequency: 'weekly' },
    ...LEGAL_SLUGS.map((slug) => ({
      path: `/rechtliches/${slug}`,
      priority: 0.2,
      frequency: 'yearly' as const,
    })),
  ];

  return paths.map(({ path, priority, frequency }) => ({
    url: `${ORIGIN}/${routing.defaultLocale}${path}`,
    changeFrequency: frequency,
    priority,
    /* hreflang, so the two written locales are declared as one document in two
       languages rather than as duplicates competing with each other. */
    alternates: {
      languages: Object.fromEntries(
        TRANSLATED_LOCALES.map((locale) => [locale, `${ORIGIN}/${locale}${path}`]),
      ),
    },
  }));
}
