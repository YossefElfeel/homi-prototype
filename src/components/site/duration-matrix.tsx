import { getTranslations } from 'next-intl/server';

import { DURATION_TIERS } from '@/mock/engines/pricing';

const PROFILES = ['standard', 'deep', 'moveout', 'office'] as const;

const HEADING: Record<(typeof PROFILES)[number], string> = {
  standard: 'durationStandard',
  deep: 'durationDeep',
  moveout: 'durationMoveout',
  office: 'durationOffice',
};

/**
 * The hours we start from, by floor area and by kind of clean.
 *
 * This one *is* tabular — the whole point is reading across a row and down a
 * column — so it stays a table on desktop. What it did not have was anything
 * to be read against: rules in `border-line-subtle`, no surface under it, and
 * a five-column grid that below `lg` became a sideways scroll on a phone,
 * which is the one shape the brief rules out in as many words.
 *
 * So: a card under it, rules that carry, the header band tinted so the eye can
 * find its way back to the top of a column, and one card per area below `lg`
 * with the four durations as a small grid. The largest and smallest hours in
 * each column are not highlighted — the reader is looking up their own flat,
 * not surveying the range, and colouring the extremes would answer a question
 * nobody asked.
 */
export async function DurationMatrix() {
  const t = await getTranslations('site.pricing');

  return (
    <>
      <div className="surface-card mt-8 hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{t('durationTitle')}</caption>
          <thead>
            <tr className="bg-sunken">
              <th scope="col" className="label-type px-6 py-4 text-ink-secondary">
                {t('durationArea')}
              </th>
              {PROFILES.map((profile) => (
                <th
                  key={profile}
                  scope="col"
                  className="label-type px-6 py-4 text-right text-ink-secondary"
                >
                  {t(HEADING[profile])}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DURATION_TIERS.map((tier) => (
              <tr key={tier.label} className="border-t border-line">
                <th scope="row" data-numeric className="px-6 py-4 font-medium">
                  {tier.label}
                </th>
                {PROFILES.map((profile) => (
                  <td key={profile} data-numeric className="px-6 py-4 text-right text-lg">
                    {tier[profile]}
                    <span className="ml-1 text-sm text-ink-tertiary">h</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Below lg: one card per area. The same numbers, reachable without
          scrolling a table sideways with a thumb. */}
      <div className="mt-8 space-y-4 lg:hidden">
        {DURATION_TIERS.map((tier) => (
          <div key={tier.label} className="surface-card p-5">
            <p data-numeric className="font-medium">
              {tier.label}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
              {PROFILES.map((profile) => (
                <div
                  key={profile}
                  className="flex items-baseline justify-between gap-3 border-t border-line pt-2.5"
                >
                  <dt className="text-sm text-ink-secondary">{t(HEADING[profile])}</dt>
                  <dd data-numeric className="shrink-0">
                    {tier[profile]}
                    <span className="ml-0.5 text-sm text-ink-tertiary">h</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
