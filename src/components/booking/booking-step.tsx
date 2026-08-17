'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, ChevronUp, RotateCcw } from 'lucide-react';

import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { MoneyRange } from '@/components/ui/money';
import { StepRail } from '@/components/ui/step-rail';
import { cn } from '@/lib/cn';
import { useHydrated, useStore } from '@/mock/store';
import { BookingSummary } from './summary';
import { useEstimate } from './use-estimate';
import { BOOKING_STEPS, TOTAL_STEPS, nextStep, prevStep, stepIndex, type BookingStepName } from './steps';

/**
 * The wizard shell. Every step gets the same five things the flow requires:
 * a progress indicator, a back button that loses nothing, the running
 * selection, an autosave notice, and a Continue button that stays disabled
 * until the step's own requirements are met.
 */
export function BookingStep({
  step,
  title,
  lead,
  canContinue,
  optional = false,
  onContinue,
  children,
}: {
  step: BookingStepName;
  title: string;
  lead?: string;
  canContinue: boolean;
  /** Steps the visitor may pass without answering anything. */
  optional?: boolean;
  onContinue?: () => boolean | void;
  children: React.ReactNode;
}) {
  const t = useTranslations('booking.shell');
  const router = useRouter();
  const hydrated = useHydrated();
  const draft = useStore((s) => s.draft);
  const resetDraft = useStore((s) => s.resetDraft);
  const estimate = useEstimate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const index = stepIndex(step);
  const back = prevStep(step);
  const forward = nextStep(step);

  function go() {
    if (onContinue && onContinue() === false) return;
    if (forward) router.push(`/anfrage/${forward}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-gutter pb-40 sm:pb-16">
      {/*
        Was eight bare 1px bars with the step names in an sr-only span: a
        sighted visitor could see that there were bars, but not which stage
        they were at or what came next. The names were already translated —
        they simply never reached the screen.
      */}
      <StepRail
        className="pt-6"
        label={t('progressLabel')}
        current={index}
        steps={BOOKING_STEPS.map((name) => ({ name, label: t(`steps.${name}`) }))}
        caption={`${t('step', { current: index + 1, total: TOTAL_STEPS })} · ${t(
          `steps.${step}`,
        )}`}
      />

      <div className="grid gap-10 pt-8 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <h1 className="display-type text-[clamp(1.75rem,4vw,2.75rem)]">{title}</h1>
          {lead && <p className="mt-4 max-w-[46ch] text-ink-secondary">{lead}</p>}

          <div className="mt-9">{children}</div>

          {/* Desktop navigation. On mobile it lives in the sticky bar below. */}
          <div className="mt-10 hidden items-center justify-between gap-4 border-t border-line-subtle pt-6 sm:flex">
            {back ? (
              <Button variant="ghost" onClick={() => router.push(`/anfrage/${back}`)}>
                <ArrowLeft className="size-4" aria-hidden />
                {t('back')}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">
              {optional && !canContinue && (
                <Button variant="ghost" onClick={go}>
                  {t('skip')}
                </Button>
              )}
              <Button size="lg" onClick={go} disabled={!canContinue && !optional}>
                {t('next')}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          {hydrated && draft.updatedAt && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-ink-tertiary">
                <Check className="size-3.5 text-eco" aria-hidden />
                {t('draftSaved')}
              </p>
              {/*
                `resetDraft` was exported from the store and called by nothing,
                so a half-finished request sat in localStorage indefinitely with
                no way to clear it — the visitor's only option was to keep
                editing whatever was already there.
              */}
              <Button
                variant="link"
                className="text-sm"
                onClick={() => {
                  resetDraft();
                  toast.success(t('draftCleared'));
                  router.push('/anfrage/leistung');
                }}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                {t('startOver')}
              </Button>
            </div>
          )}
        </div>

        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-24">
            <BookingSummary />
          </div>
        </aside>
      </div>

      {/* Mobile: an expandable summary bar that also carries the navigation, so
          Continue is always in reach of a thumb. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-subtle bg-page/97 backdrop-blur-sm sm:hidden">
        {sheetOpen && (
          <div className="max-h-[50vh] overflow-y-auto border-b border-line-subtle px-gutter py-4">
            <BookingSummary compact />
          </div>
        )}

        <button
          type="button"
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
          className="flex w-full items-center justify-between gap-3 px-gutter py-2.5 text-left"
        >
          <span className="label-type text-ink-tertiary">
            {sheetOpen ? t('summaryClose') : t('summaryOpen')}
          </span>
          <span className="flex items-center gap-2">
            {estimate ? (
              <MoneyRange
                low={estimate.rangeLow}
                high={estimate.rangeHigh}
                className="text-sm font-semibold"
              />
            ) : (
              <span className="text-sm text-ink-tertiary">{t('estimatePending')}</span>
            )}
            <ChevronUp
              className={cn('size-4 text-ink-tertiary transition-transform', sheetOpen && 'rotate-180')}
              aria-hidden
            />
          </span>
        </button>

        <div className="flex items-center gap-3 px-gutter pt-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {back && (
            <Button
              variant="secondary"
              size="icon"
              aria-label={t('back')}
              onClick={() => router.push(`/anfrage/${back}`)}
            >
              <ArrowLeft className="size-4" aria-hidden />
            </Button>
          )}
          <Button block size="lg" onClick={go} disabled={!canContinue && !optional}>
            {optional && !canContinue ? t('skip') : t('next')}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
