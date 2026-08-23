import { Camera, Clock, FileCheck, ShieldCheck, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SectionHeading, Section } from './section-heading';

import type { Theme } from '@/lib/theme';

/**
 * SIGNATURE COMPONENT — and a design decision worth naming.
 *
 * At launch Homivaro has zero reviews. An empty carousel reading "no reviews
 * yet" actively damages trust on the one page that has to earn it, so the
 * default state of the social-proof slot is not an empty carousel — it is a
 * written commitment. Every line here is a checkable promise, not a claim.
 *
 * The reviews carousel takes this slot automatically once reviews exist
 * (see the `busy` demo scenario).
 *
 * The insurance line only appears when a policy actually exists (§21 item 12).
 * With the toggle off it is replaced by a commitment we can keep today — the
 * page never claims cover that is not there.
 */
export function ProofBlock({
  theme,
  hasInsurance,
}: {
  theme: Theme;
  hasInsurance: boolean;
}) {
  const t = useTranslations('site.home.promise');

  const promises = [
    { icon: FileCheck, title: t('p1Title'), body: t('p1Body') },
    { icon: Clock, title: t('p2Title'), body: t('p2Body') },
    { icon: Camera, title: t('p3Title'), body: t('p3Body') },
    { icon: UserRound, title: t('p4Title'), body: t('p4Body') },
    ...(hasInsurance
      ? [{ icon: ShieldCheck, title: t('p5Title'), body: t('p5Body') }]
      : []),
  ];

  if (theme === 'goldkueste') {
    return (
      <Section tone="inverse">
        <SectionHeading
          theme={theme}
          eyebrow={t('eyebrow')}
          title={t('title')}
          lead={t('lead')}
        />
        <ul className="mx-auto mt-14 max-w-3xl divide-y divide-white/12 border-y border-white/12">
          {promises.map((promise) => (
            <li key={promise.title} className="flex gap-6 py-7">
              <promise.icon
                className="mt-0.5 size-5 shrink-0 text-white/50"
                aria-hidden
              />
              <div>
                <h3 className="text-lg">{promise.title}</h3>
                <p className="mt-1.5 text-ink-inverse-secondary">{promise.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    );
  }

  if (theme === 'zuhause') {
    return (
      <Section tone="sunken">
        <SectionHeading
          theme={theme}
          eyebrow={t('eyebrow')}
          title={t('title')}
          lead={t('lead')}
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promises.map((promise) => (
            <li
              key={promise.title}
              className="surface-card p-6 shadow-[var(--shadow-sm)]"
            >
              <promise.icon className="size-5 text-eco" aria-hidden />
              <h3 className="mt-4 font-medium">{promise.title}</h3>
              <p className="mt-2 text-sm text-ink-secondary">{promise.body}</p>
            </li>
          ))}
        </ul>
      </Section>
    );
  }

  return (
    <Section tone="sunken">
      <div className="grid gap-10 lg:grid-cols-12">
        <SectionHeading
          theme={theme}
          eyebrow={t('eyebrow')}
          title={t('title')}
          lead={t('lead')}
          className="lg:col-span-5"
        />
        <ol className="divide-y divide-line-subtle border-y border-line-subtle lg:col-span-7">
          {promises.map((promise, i) => (
            <li key={promise.title} className="flex gap-5 py-5">
              <span
                data-numeric
                aria-hidden
                className="label-type w-6 shrink-0 pt-1 text-ink-tertiary"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-medium">{promise.title}</h3>
                <p className="mt-1.5 text-sm text-ink-secondary">{promise.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
