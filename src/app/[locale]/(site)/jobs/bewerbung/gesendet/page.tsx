import { setRequestLocale } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { ApplicationSent } from '@/components/careers/application-sent';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Screen C5 — application received. */
export default async function ApplicationSentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { locale } = await params;
  const { ref } = await searchParams;
  setRequestLocale(locale);

  return (
    <div className="py-section">
      <ApplicationSent reference={ref ?? 'BW-0000'} />
    </div>
  );
}
