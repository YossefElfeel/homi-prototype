import { setRequestLocale } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { ApplicationForm } from '@/components/careers/application-form';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Screens C3 and C4 — one route, two steps.
 *
 * `?stelle=` carries the role across from the posting. Without it the form is
 * a speculative application, which is the same form minus one line of context.
 */
export default async function ApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ stelle?: string }>;
}) {
  const { locale } = await params;
  const { stelle } = await searchParams;
  setRequestLocale(locale);

  return (
    <div className="py-section">
      <ApplicationForm postingSlug={stelle} />
    </div>
  );
}
