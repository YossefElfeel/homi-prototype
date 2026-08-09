'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ChevronDown,
  LayoutList,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  HelpCircle,
  X,
} from 'lucide-react';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import { THEMES, THEME_META, type Theme } from '@/lib/theme';
import { applyInsurance, applyStress, applyTheme } from '@/lib/preferences';
import { cn } from '@/lib/cn';
import { useHydrated, useStore, type DemoRole } from '@/mock/store';
import { SCENARIOS, type ScenarioName } from '@/mock/scenarios';

const ROLES: DemoRole[] = ['visitor', 'customer', 'owner', 'contractor'];

/**
 * Prototype control surface — never part of the product.
 *
 * Deliberately styled as a tool, not as Homivaro: it sits on a fixed dark
 * chrome that belongs to none of the three directions, so nobody reviewing a
 * screen mistakes it for part of the design.
 */
export function DemoBar({
  initialTheme,
  initialStress,
}: {
  initialTheme: Theme;
  initialStress: boolean;
}) {
  const t = useTranslations('demo');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const [, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [stress, setStress] = useState(initialStress);

  const demo = useStore((s) => s.demo);
  const settings = useStore((s) => s.settings);
  const setRole = useStore((s) => s.setRole);
  const setScenario = useStore((s) => s.setScenario);
  const setDateOverride = useStore((s) => s.setDateOverride);
  const updateSettings = useStore((s) => s.updateSettings);
  const reset = useStore((s) => s.reset);

  function onTheme(next: Theme) {
    setTheme(next);
    // Tokens flip instantly via the attribute — no wait, no flash. The refresh
    // is only for the six signature components, which change layout rather
    // than tokens and are therefore rendered on the server.
    applyTheme(next);
    startTransition(() => router.refresh());
  }

  function onInsurance(next: boolean) {
    updateSettings({ hasLiabilityInsurance: next });
    applyInsurance(next);
    startTransition(() => router.refresh());
  }

  function onStress(next: boolean) {
    setStress(next);
    applyStress(next);
    // Messages are expanded server-side in getRequestConfig, so the tree has
    // to be re-fetched for the change to reach every string.
    startTransition(() => router.refresh());
  }

  function onLocale(next: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('open')}
        // Raised on small screens so it clears the mobile sticky bars — the
        // booking flow's Continue button and the site's request CTA both live
        // at bottom:0, and a review tool that covers the primary action is
        // worse than no tool.
        className="fixed right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 flex items-center gap-2 rounded-full bg-[#111318] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:bottom-4"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        <span className="hidden sm:inline">{THEME_META[theme].name}</span>
        <span className="sm:hidden">{t('title')}</span>
      </button>
    );
  }

  return (
    <div className="fixed right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-[#111318] text-white shadow-[0_24px_70px_-20px_rgba(0,0,0,0.75)] sm:bottom-4">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">
          {t('title')}
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t('close')}
          className="rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 py-4 text-sm">
        <Field label={t('theme')}>
          <div className="grid gap-1.5">
            {THEMES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onTheme(value)}
                aria-pressed={theme === value}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left transition-colors',
                  theme === value
                    ? 'border-white/70 bg-white/12'
                    : 'border-white/10 hover:bg-white/6',
                )}
              >
                <span className="block font-medium">{THEME_META[value].name}</span>
                <span className="block text-[0.6875rem] leading-snug text-white/50">
                  {THEME_META[value].note}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label={t('locale')}>
          <Segmented
            options={routing.locales.map((value) => ({
              value,
              label: value.toUpperCase(),
              title: TRANSLATED_LOCALES.includes(value)
                ? LOCALE_LABELS[value]
                : `${LOCALE_LABELS[value]} — fällt auf Deutsch zurück`,
              muted: !TRANSLATED_LOCALES.includes(value),
            }))}
            value={locale}
            onChange={(value) => onLocale(value as Locale)}
          />
        </Field>

        <Field label={t('role')}>
          <Segmented
            options={ROLES.map((value) => ({ value, label: t(`roles.${value}`) }))}
            value={demo.role}
            onChange={(value) => setRole(value as DemoRole)}
            columns={2}
          />
        </Field>

        <Field label={t('scenario')}>
          <select
            aria-label={t('scenario')}
            value={demo.scenario}
            onChange={(e) => setScenario(e.target.value as ScenarioName)}
            className="w-full rounded-lg border border-white/15 bg-white/6 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {SCENARIOS.map((value) => (
              <option key={value} value={value} className="bg-[#111318]">
                {t(`scenarios.${value}`)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('today')}>
          <input
            type="date"
            aria-label={t('today')}
            value={demo.dateOverride?.slice(0, 10) ?? ''}
            onChange={(e) =>
              setDateOverride(e.target.value ? new Date(e.target.value).toISOString() : null)
            }
            className="w-full rounded-lg border border-white/15 bg-white/6 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [color-scheme:dark]"
          />
        </Field>

        <Toggle
          icon={<ShieldCheck className="size-4" aria-hidden />}
          label={t('insurance')}
          checked={hydrated ? settings.hasLiabilityInsurance : false}
          onChange={onInsurance}
        />

        <Toggle
          label={t('stress')}
          hint={t('stressHint')}
          checked={stress}
          onChange={onStress}
        />

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
          <ToolLink href="/screens" icon={<LayoutList className="size-3.5" aria-hidden />}>
            {t('screens')}
          </ToolLink>
          <ToolLink
            href="/open-questions"
            icon={<HelpCircle className="size-3.5" aria-hidden />}
          >
            {t('openQuestions')}
          </ToolLink>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(t('resetConfirm'))) reset();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {t('reset')}
        </button>
      </div>
    </div>
  );
}

/**
 * The demo bar is the one place in the codebase with raw hex.
 *
 * That is deliberate: it must look identical in all four themes so nobody
 * mistakes it for part of the design being reviewed. Theming it would make it
 * a fifth surface to evaluate, which is the opposite of what it is for.
 */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="block text-[0.6875rem] font-medium tracking-[0.1em] text-white/45 uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
  columns = 4,
}: {
  options: { value: string; label: string; title?: string; muted?: boolean }[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
            value === option.value
              ? 'border-white/70 bg-white/12 text-white'
              : 'border-white/10 text-white/60 hover:bg-white/6',
            option.muted && 'italic',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  hint,
  icon,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition-colors hover:bg-white/6">
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[0.6875rem] leading-snug text-white/45">
            {hint}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-white"
      />
    </label>
  );
}

function ToolLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      {icon}
      {children}
      <ChevronDown className="size-3 -rotate-90 opacity-50" aria-hidden />
    </Link>
  );
}
