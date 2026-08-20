'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { PlanForm, planToDraft } from '@/components/admin/plan-form';
import { useHydrated, useStore } from '@/mock/store';

/** Screen 69b — editing a plan. */
export default function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('admin.planForm');
  const router = useRouter();
  const hydrated = useHydrated();

  const plan = useStore((s) => s.plans.find((p) => p.id === id));
  const updatePlan = useStore((s) => s.updatePlan);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;
  if (!plan) {
    return (
      <div>
        <PageHeader title={t('editTitle')} back={{ href: '/admin/abos', label: t('back') }} />
        <EmptyState title={t('missingTitle')} body={t('missingBody')} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('editTitle')}
        /*
         * Editing a live plan changes what it costs and what it includes for
         * everyone who buys it *next*. It cannot change a term already sold —
         * that price is on an invoice somebody paid — and saying so here is
         * cheaper than fielding the question later.
         */
        lead={t('editLead')}
        back={{ href: `/admin/abos/${plan.id}`, label: t('backToPlan') }}
      />
      <PlanForm
        initial={planToDraft(plan)}
        submitLabel={t('save')}
        onCancel={() => router.push(`/admin/abos/${plan.id}`)}
        onSubmit={(draft) => {
          updatePlan(plan.id, draft);
          toast.success(t('saved'));
          router.push(`/admin/abos/${plan.id}`);
        }}
      />
    </div>
  );
}
