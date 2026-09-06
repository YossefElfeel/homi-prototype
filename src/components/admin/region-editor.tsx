'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Info, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import { regionUsage } from '@/lib/region-facts';
import { slugify } from '@/lib/service-catalogue';
import { SERVED_REGIONS, validateRegion, type ServedRegion } from '@/mock/engines/coverage';
import { useStore } from '@/mock/store';

/**
 * A draft area, before it is a record.
 *
 * Coordinates are held as strings rather than numbers, which is not laziness:
 * a `NumberField` bound to state cannot hold «47.» while somebody is typing
 * the decimal, so every keystroke past the point either snaps back or writes
 * NaN into the store. The parse happens once, at validation.
 */
interface Draft {
  postcode: string;
  name: string;
  slug: string;
  lat: string;
  lng: string;
  /** Whether the slug is still following the name, or has been typed over. */
  slugTouched: boolean;
}

const EMPTY: Draft = {
  postcode: '',
  name: '',
  slug: '',
  lat: '',
  lng: '',
  slugTouched: false,
};

function draftFrom(region: ServedRegion): Draft {
  return {
    postcode: region.postcode,
    name: region.name,
    slug: region.slug,
    lat: String(region.lat),
    lng: String(region.lng),
    slugTouched: true,
  };
}

/**
 * The service area, as a list somebody can add to.
 *
 * It was eight rows and eight switches over a frozen array, which made the tab
 * look like it managed the service area while it could only ever turn parts of
 * it off. «Wir reinigen jetzt auch in Zollikon» was a code change — for a
 * business whose whole shape is a deliberately tight local area (§6), that is
 * the one growth move the product could not express.
 *
 * The switch stays and now means something narrower than it looks: **on/off is
 * not the same decision as add/remove**, and both are offered because the
 * business needs both. Switching an area off stops new requests and leaves
 * every property, job and invoice in that town standing. Removing it deletes
 * the row, which is why it is refused while anything points at the postcode —
 * see `regionUsage` for what breaks silently otherwise.
 */
export function RegionEditor() {
  const t = useTranslations('admin.settings');

  const regions = useStore((s) => s.regions);
  const settings = useStore((s) => s.settings);
  const data = useStore((s) => s.data);
  const updateSettings = useStore((s) => s.updateSettings);
  const addRegion = useStore((s) => s.addRegion);
  const updateRegion = useStore((s) => s.updateRegion);
  const removeRegion = useStore((s) => s.removeRegion);

  /** `null` closed · `'new'` adding · a postcode means editing that row. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [doomed, setDoomed] = useState<ServedRegion | null>(null);

  const sorted = [...regions].sort((a, b) => a.name.localeCompare(b.name));
  const on = regions.filter((r) => settings.servedPostcodes.includes(r.postcode)).length;

  function open(region?: ServedRegion) {
    setDraft(region ? draftFrom(region) : EMPTY);
    setEditing(region ? region.postcode : 'new');
  }

  function patch(next: Partial<Draft>) {
    setDraft((current) => {
      const merged = { ...current, ...next };
      /* The slug follows the name until somebody types in it. Deriving it
         every time would overwrite a hand-picked URL on the next keystroke in
         the name field; never deriving it would make «Zollikon» ship with an
         empty page address, which `validateRegion` refuses and nobody would
         understand. */
      if (next.name !== undefined && !merged.slugTouched) merged.slug = slugify(next.name);
      return merged;
    });
  }

  const candidate: ServedRegion = {
    postcode: draft.postcode.trim(),
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    lat: Number(draft.lat),
    lng: Number(draft.lng),
  };
  const problem =
    editing === null
      ? null
      : validateRegion(candidate, regions, editing === 'new' ? undefined : editing);

  function save() {
    if (problem) return;
    if (editing === 'new') {
      addRegion(candidate);
      toast.success(t('regionsAdded', { name: candidate.name }));
    } else if (editing) {
      updateRegion(editing, candidate);
    }
    setEditing(null);
  }

  const usage = doomed ? regionUsage(doomed.postcode, data) : null;
  const blocked = usage !== null && usage.total > 0;
  const breakdown = usage
    ? [
        usage.properties > 0 ? t('regionsUsageProperties', { n: usage.properties }) : null,
        usage.customers > 0 ? t('regionsUsageCustomers', { n: usage.customers }) : null,
        usage.applications > 0
          ? t('regionsUsageApplications', { n: usage.applications })
          : null,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="display-type text-xl">{t('regionsTitle')}</h2>
          <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">
            {t('regionsLead')}
          </p>
        </div>
        <Button variant="secondary" onClick={() => open()}>
          <Plus className="size-4" aria-hidden />
          {t('regionsAdd')}
        </Button>
      </div>

      <p data-numeric className="mt-4 text-sm text-ink-tertiary">
        {t('regionsCount', { n: regions.length, on })}
      </p>

      <ul className="mt-4 border-t border-line-subtle">
        {sorted.map((region) => {
          const included = settings.servedPostcodes.includes(region.postcode);
          return (
            <li
              key={region.postcode}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-line-subtle py-3 last:border-b-0"
            >
              <span className="flex items-baseline gap-3">
                <span data-numeric className="text-ink-tertiary">
                  {region.postcode}
                </span>
                <span id={`region-${region.postcode}`} className="font-medium">
                  {region.name}
                </span>
                <span className="font-mono text-xs text-ink-tertiary">
                  /gebiete/{region.slug}
                </span>
              </span>

              <span className="flex items-center gap-1 sm:gap-3">
                {/*
                  A switch, not a tick. Nothing on this screen is staged: the
                  postcode leaves the service area the instant it is flipped
                  and the quote engine reads the new list on the next request.
                  A checkbox says a form is being filled in and a save button
                  is waiting somewhere below — there is none, and the lead
                  text says so.
                */}
                <span
                  className={cn(
                    'min-w-24 text-right text-sm',
                    included ? 'text-ink-secondary' : 'text-ink-tertiary',
                  )}
                >
                  {included ? t('regionsIncluded') : t('regionsExcluded')}
                </span>
                <Switch
                  aria-labelledby={`region-${region.postcode}`}
                  checked={included}
                  onCheckedChange={(next) =>
                    updateSettings({
                      servedPostcodes: next
                        ? [...settings.servedPostcodes, region.postcode]
                        : settings.servedPostcodes.filter((p) => p !== region.postcode),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${t('regionsEdit')} — ${region.name}`}
                  onClick={() => open(region)}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${t('regionsRemove')} — ${region.name}`}
                  onClick={() => setDoomed(region)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 flex max-w-[var(--measure)] items-start gap-2 text-sm text-ink-secondary">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('regionsZurichNote')}
      </p>
      <p className="mt-3 flex max-w-[var(--measure)] items-start gap-2 text-sm text-ink-secondary">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('regionsBuildNote')}
      </p>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === 'new'
                ? t('regionsAddTitle')
                : t('regionsEditTitle', { name: draft.name })}
            </DialogTitle>
            <DialogDescription>{t('regionsAddLead')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('regionsFieldPostcode')} hint={t('regionsFieldPostcodeHint')}>
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  maxLength={4}
                  value={draft.postcode}
                  onChange={(e) => patch({ postcode: e.target.value })}
                />
              )}
            </Field>
            <Field label={t('regionsFieldName')} hint={t('regionsFieldNameHint')}>
              {(props) => (
                <Input
                  {...props}
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              )}
            </Field>
            <Field
              label={t('regionsFieldSlug')}
              hint={t('regionsFieldSlugHint', { slug: draft.slug || '…' })}
              className="sm:col-span-2"
            >
              {(props) => (
                <Input
                  {...props}
                  value={draft.slug}
                  onChange={(e) => patch({ slug: slugify(e.target.value), slugTouched: true })}
                />
              )}
            </Field>
            <Field label={t('regionsFieldLat')}>
              {(props) => (
                <Input
                  {...props}
                  inputMode="decimal"
                  value={draft.lat}
                  onChange={(e) => patch({ lat: e.target.value })}
                />
              )}
            </Field>
            <Field label={t('regionsFieldLng')}>
              {(props) => (
                <Input
                  {...props}
                  inputMode="decimal"
                  value={draft.lng}
                  onChange={(e) => patch({ lng: e.target.value })}
                />
              )}
            </Field>
            <p className="text-sm text-ink-secondary sm:col-span-2">
              {t('regionsCoordsHint')}
            </p>
          </div>

          {/* The refusal names which rule was broken. «Bitte prüfen Sie Ihre
              Eingaben» over five fields is a message that makes the reader do
              the diagnosis the form already did. */}
          {problem && draft.postcode !== '' && (
            <p className="mt-2 rounded-[var(--radius-sm)] border border-status-danger-line bg-status-danger px-3 py-2 text-sm text-status-danger-fg">
              {t(
                problem === 'postcodeFormat'
                  ? 'regionsErrorPostcodeFormat'
                  : problem === 'postcodeTaken'
                    ? 'regionsErrorPostcodeTaken'
                    : problem === 'nameRequired'
                      ? 'regionsErrorNameRequired'
                      : problem === 'slugTaken'
                        ? 'regionsErrorSlugTaken'
                        : 'regionsErrorCoordinates',
              )}
            </p>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {t('regionsCancel')}
            </Button>
            <Button disabled={problem !== null} onClick={save}>
              {editing === 'new' ? t('regionsSave') : t('regionsSaveEdit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={doomed !== null} onOpenChange={(open) => !open && setDoomed(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blocked
                ? t('regionsRemoveBlockedTitle', { name: doomed?.name ?? '' })
                : t('regionsRemoveTitle', { name: doomed?.name ?? '' })}
            </DialogTitle>
            <DialogDescription>
              {blocked
                ? t('regionsRemoveBlockedBody', { n: usage?.total ?? 0, breakdown })
                : t('regionsRemoveBody')}
            </DialogDescription>
          </DialogHeader>

          {/* A seeded area has a statically rendered page behind it that goes
              on answering until the next deploy. Removing the row without
              saying so leaves a live page advertising a town the request flow
              now refuses — which is the same class of silent disagreement the
              usage gate above exists to stop. */}
          {!blocked && doomed && SERVED_REGIONS.some((r) => r.slug === doomed.slug) && (
            <p className="rounded-[var(--radius-sm)] bg-sunken px-3 py-2 text-sm text-ink-secondary">
              {t('regionsRemoveSeeded', { slug: doomed.slug })}
            </p>
          )}

          <DialogFooter>
            {blocked ? (
              <Button onClick={() => setDoomed(null)}>
                {t('regionsRemoveBlockedClose')}
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setDoomed(null)}>
                  {t('regionsCancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (!doomed) return;
                    if (removeRegion(doomed.postcode)) {
                      toast.success(t('regionsRemoved', { name: doomed.name }));
                    }
                    setDoomed(null);
                  }}
                >
                  {t('regionsRemoveConfirm')}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
