import { setRequestLocale } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { ApplicationStatusCheck } from '@/components/careers/application-status';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Screen C6 — check an application status by reference number. */
export default async function ApplicationStatusPage({
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
      <ApplicationStatusCheck initialReference={ref} />
    </div>
  );
}
