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
  Palette,
  Ruler,
  Waypoints,
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
 * Where each role actually lives.
 *
 * Switching the role used to change permissions and leave you on the page you
 * were already on — so picking "Owner" on the homepage looked like the control
 * was broken. Nothing links to /admin, /konto or /einsatz from the public site
 * (deliberately: that navigation belongs to customers), which left the URL bar
 * as the only way in. The switcher now takes you there.
 *
 * Staying put when you are already inside that role's area, so switching
 * customer → owner from a deep admin screen does not throw away your place.
 */
const ROLE_HOME: Record<DemoRole, string> = {
  visitor: '/',
  customer: '/konto',
  owner: '/admin',
  contractor: '/einsatz',
};

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
  const setCurrentCustomer = useStore((s) => s.setCurrentCustomer);
  const customers = useStore((s) => s.data.customers);
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
        {/* The role belongs on the closed pill. Switching role changes what
            most of the app will show you, and with only the theme name here
            the control looked like it had done nothing. */}
        <span className="hidden sm:inline">
          {hydrated ? t(`roles.${demo.role}`) : THEME_META[theme].name}
        </span>
        <span className="sm:hidden">{t('title')}</span>
        {hydrated && demo.dateOverride && (
          <span
            title={t('todayActive')}
            className="rounded-full bg-white/15 px-1.5 py-0.5 text-[0.625rem] font-medium"
          >
            <span className="sr-only">{t('todayActive')} </span>
            {/* Day first — this is a Swiss product and 12.24 would read as
                the 12th of some month. */}
            <span data-numeric>
              {demo.dateOverride.slice(8, 10)}.{demo.dateOverride.slice(5, 7)}.
            </span>
          </span>
        )}
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
            label={t('locale')}
            onChange={(value) => onLocale(value as Locale)}
          />
        </Field>

        <Field label={t('role')}>
          <Segmented
            options={ROLES.map((value) => ({ value, label: t(`roles.${value}`) }))}
            value={demo.role}
            label={t('role')}
            onChange={(value) => {
              const role = value as DemoRole;
              setRole(role);
              const home = ROLE_HOME[role];
              if (home !== '/' && !pathname.startsWith(home)) router.push(home);
            }}
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

        {/*
          `setCurrentCustomer` was exported from the store and called by
          nothing, and demo.currentCustomerId was pinned to 'cus_2' — so ten
          account screens listed an `empty` state in the delivery contract that
          could only be reached by switching the whole scenario. Switching the
          customer is the honest way to see them.
        */}
        <Field label={t('customer')}>
          <select
            aria-label={t('customer')}
            value={demo.currentCustomerId}
            onChange={(e) => setCurrentCustomer(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/6 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id} className="bg-[#111318]">
                {customer.firstName} {customer.lastName}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('today')}>
          <div className="flex gap-2">
            <input
              type="date"
              aria-label={t('today')}
              value={demo.dateOverride?.slice(0, 10) ?? ''}
              onChange={(e) =>
                setDateOverride(
                  e.target.value ? new Date(e.target.value).toISOString() : null,
                )
              }
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/6 px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [color-scheme:dark]"
            />
            {/* Clearing a date input is fiddly in every browser, and an
                overridden clock silently changes what every screen shows —
                so getting back to the real today needs one obvious button. */}
            {demo.dateOverride && (
              <button
                type="button"
                onClick={() => setDateOverride(null)}
                className="shrink-0 rounded-lg border border-white/15 px-3 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t('todayReset')}
              </button>
            )}
          </div>
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
          {/* The board that tracks whether a flow has an entry had no entry of
              its own: this bar linked the other four and skipped it, so the one
              page that answers "can you get in, act and get out" was reachable
              only by typing the URL. */}
          <ToolLink href="/flows" icon={<Waypoints className="size-3.5" aria-hidden />}>
            {t('flows')}
          </ToolLink>
          <ToolLink
            href="/open-questions"
            icon={<HelpCircle className="size-3.5" aria-hidden />}
          >
            {t('openQuestions')}
          </ToolLink>
          {/* /foundations is the token proof sheet and had zero inbound links
              anywhere in the codebase — the one page that demonstrates the
              design system was reachable only by typing the URL. */}
          <ToolLink
            href="/foundations"
            icon={<Palette className="size-3.5" aria-hidden />}
          >
            {t('foundations')}
          </ToolLink>
          {/* The pair, and they answer different questions: /foundations proves
              the token layer survives a theme switch, /design-system specifies
              the one direction that ships. Linked side by side so a reviewer
              does not have to guess which of the two they wanted. */}
          <ToolLink
            href="/design-system"
            icon={<Ruler className="size-3.5" aria-hidden />}
          >
            {t('designSystem')}
          </ToolLink>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!window.confirm(t('resetConfirm'))) return;
            reset();
            // Insurance and stress mode live in cookies as well as the store,
            // because the server reads them at render time. Resetting only the
            // store left the cookies behind, so the About page kept claiming
            // cover the settings screen said was off.
            setStress(false);
            applyStress(false);
            applyInsurance(false);
            startTransition(() => router.refresh());
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
  label,
}: {
  options: { value: string; label: string; title?: string; muted?: boolean }[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
  /** Names the group. Without it a screen reader reads four bare buttons. */
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
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
