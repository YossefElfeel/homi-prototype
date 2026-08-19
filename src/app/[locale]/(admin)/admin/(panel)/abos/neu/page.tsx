'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { PlanForm, emptyPlanDraft } from '@/components/admin/plan-form';
import { useHydrated, useNow, useStore } from '@/mock/store';

/** Screen 69a — a new plan. */
export default function NewPlanPage() {
  const t = useTranslations('admin.planForm');
  const router = useRouter();
  const now = useNow();
  const hydrated = useHydrated();
  const createPlan = useStore((s) => s.createPlan);

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  return (
    <div>
      <PageHeader
        title={t('newTitle')}
        lead={t('newLead')}
        back={{ href: '/admin/abos', label: t('back') }}
      />
      <PlanForm
        initial={emptyPlanDraft()}
        submitLabel={t('create')}
        onCancel={() => router.push('/admin/abos')}
        onSubmit={(draft) => {
          const id = createPlan(draft, now);
          toast.success(t('created'));
          router.push(`/admin/abos/${id}`);
        }}
      />
    </div>
  );
}
