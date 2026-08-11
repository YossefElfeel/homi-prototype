import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * /anfrage always enters at the first step.
 *
 * The three marketing CTAs — a service page, a plan card, a region page — all
 * arrive here carrying what the visitor just clicked. This used to redirect
 * without the query string, so every one of them started the wizard blank and
 * the visitor re-picked the thing they had already chosen. The whitelist is
 * explicit: only these three travel on, and the service step validates each
 * before it writes anything.
 */
export default async function BookingIndex({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ leistung?: string; abo?: string; plz?: string }>;
}) {
  const { locale } = await params;
  const { leistung, abo, plz } = await searchParams;

  const query = new URLSearchParams();
  if (leistung) query.set('leistung', leistung);
  if (abo) query.set('abo', abo);
  if (plz) query.set('plz', plz);

  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  redirect({ href: `/anfrage/leistung${suffix}`, locale });
}
