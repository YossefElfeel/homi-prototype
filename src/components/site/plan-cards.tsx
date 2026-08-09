import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { SEED_SETTINGS } from '@/mock/seed';
import type { PlanTier } from '@/mock/schema';
import { cn } from '@/lib/cn';

const PLANS: { tier: PlanTier; freqKey: 'freqBasic' | 'freqPremium' | 'freqVip' }[] = [
  { tier: 'basic', freqKey: 'freqBasic' },
  { tier: 'premium', freqKey: 'freqPremium' },
  { tier: 'vip', freqKey: 'freqVip' },
];

const LABELS: Record<PlanTier, string> = {
  basic: 'Basic',
  premium: 'Premium',
  vip: 'VIP',
};

/**
 * Plan cards. Premium is marked as the sensible default rather than the most
 * expensive one — a "recommended" badge on the top tier reads as a sales
 * tactic, and this audience discounts it.
 */
export function PlanCards({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('site.plans');

  return (
    <ul className="grid gap-5 lg:grid-cols-3">
      {PLANS.map(({ tier, freqKey }) => {
        const featured = tier === 'premium';
        return (
          <li
            key={tier}
            className={cn(
              'surface-card relative flex flex-col p-7',
              featured && 'border-line-strong',
            )}
          >
            {featured && (
              <span className="label-type absolute -top-2.5 left-7 bg-rule px-2 py-1 text-white">
                {t('recommended')}
              </span>
            )}

            <h3 className="display-type text-2xl">{LABELS[tier]}</h3>
            <p className="mt-1.5 text-ink-secondary">{t(freqKey)}</p>

            <p data-numeric className="mt-6 text-4xl">
              −{SEED_SETTINGS.planDiscounts[tier]}
              <span className="text-2xl">%</span>
            </p>
            <p className="mt-1 text-sm text-ink-tertiary">{t('rowDiscount')}</p>

            {!compact && (
              <ul className="mt-6 space-y-2.5 border-t border-line-subtle pt-6 text-sm">
                <Feature>
                  {t('rowPriority')}: {tier === 'basic' ? t('priorityNo') : t('priorityYes')}
                </Feature>
                <Feature>
                  {t('rowSameTeam')}: {tier === 'vip' ? t('sameTeamAlways') : t('priorityNo')}
                </Feature>
                <Feature>
                  {t('rowSkips')}: {t('skips')}
                </Feature>
                <Feature>
                  {t('rowCommitment')}: {t('commitment')}
                </Feature>
              </ul>
            )}

            <div className="mt-7 flex-1" />
            <Button asChild block variant={featured ? 'primary' : 'secondary'}>
              <Link href={`/anfrage?abo=${tier}`}>{t('cta')}</Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <Check className="mt-0.5 size-4 shrink-0 text-eco" aria-hidden />
      <span className="text-ink-secondary">{children}</span>
    </li>
  );
}
