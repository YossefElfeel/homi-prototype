import { getTranslations } from 'next-intl/server';

/**
 * The route-level loading state.
 *
 * A three-bar skeleton rather than a spinner: it reserves the space the
 * heading and lead will occupy, so the page does not jump when content
 * arrives. `prefers-reduced-motion` removes the pulse — the layout still
 * communicates "something is coming" without the movement.
 */
export default async function Loading() {
  const t = await getTranslations('errors');

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-7xl px-gutter py-section"
    >
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden className="motion-safe:animate-pulse">
        <div className="h-3 w-24 rounded-sm bg-sunken" />
        <div className="mt-6 h-10 w-3/4 max-w-xl rounded-sm bg-sunken" />
        <div className="mt-4 h-4 w-full max-w-lg rounded-sm bg-sunken" />
        <div className="mt-2 h-4 w-2/3 max-w-md rounded-sm bg-sunken" />
      </div>
    </div>
  );
}
