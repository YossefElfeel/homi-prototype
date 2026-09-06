'use client';

import { use, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { useLocale, useMessages, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExternalLink, Info } from 'lucide-react';

import { LOCALE_LABELS, routing, TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { ContentFieldEditor } from '@/components/admin/content-field-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination, paginate } from '@/components/ui/pagination';
import { SaveIndicator } from '@/components/ui/save-indicator';
import { SkeletonPage } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';
import {
  contentText,
  countSurface,
  editMap,
  resolveContent,
  surfaceById,
  type ContentField,
} from '@/lib/content-registry';
import { useHydrated, useStore } from '@/mock/store';
import type { ContentValue } from '@/mock/schema';

/** Enough to scroll through; not enough to render 2547 text boxes at once. */
const PER_PAGE = 20;

/**
 * A name for a block that was never given one.
 *
 * Splits `notIncludedLead` into «Not included lead». It is a derived name and
 * it reads like one — but the alternative was printing `site.pricing.title` as
 * the field's title, which is not a name at all, and hand-writing 999 of them
 * is not a thing anybody maintains. The ~70 that carry most of the volume are
 * written in `admin.website.words`; this catches the tail, and the dotted key
 * stays underneath so the derived name never has to be exact.
 */
function humanise(segment: string) {
  const words = segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Screen 85a — one surface, one language at a time.
 *
 * The catalogue editor next door shows all four languages side by side, and
 * that is right for a service *name*: four short strings fit on a row, and
 * seeing them together is how a missing translation announces itself. It does
 * not survive contact with a lead paragraph, an eight-item list and a
 * three-question FAQ — four columns of that is a wall nobody reads, and on a
 * laptop it is four columns of about twelve characters each.
 *
 * So this screen tabs by language and pays for it in two places, deliberately:
 *
 *  · **The tab carries its own gap count.** Switching language to find out
 *    whether English is written would be the failure the four-column layout
 *    exists to prevent, so the number is on the tab before you press it.
 *  · **Every block says where its text came from.** §20.6 means an
 *    untranslated English block renders German and looks finished. The badge
 *    on each block is the only thing that separates «geschrieben» from «zeigt
 *    Deutsch», and it is why `resolveContent` returns a reason rather than a
 *    string.
 */
export default function ContentSurfacePage({
  params,
}: {
  params: Promise<{ surface: string }>;
}) {
  const { surface: surfaceId } = use(params);
  const t = useTranslations('admin.website');
  const appT = useTranslations('app');
  const actionsT = useTranslations('actions');
  const readerLocale = useLocale() as Locale;
  const messages = useMessages();
  const hydrated = useHydrated();

  const services = useStore((s) => s.services);
  const content = useStore((s) => s.content);
  const setContent = useStore((s) => s.setContent);
  const resetContent = useStore((s) => s.resetContent);

  const [locale, setLocale] = useState<Locale>(readerLocale);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<ContentField | null>(null);

  const edits = useMemo(() => editMap(content), [content]);
  const surface = useMemo(
    () => surfaceById(surfaceId, services, readerLocale),
    [surfaceId, services, readerLocale],
  );

  const matching = useMemo(() => {
    if (!surface) return [];
    const q = query.trim().toLowerCase();
    if (!q) return surface.fields;

    return surface.fields.filter((field) => {
      if (field.hint.toLowerCase().includes(q)) return true;
      return contentText(resolveContent(field, locale, edits).value)
        .toLowerCase()
        .includes(q);
    });
  }, [surface, query, locale, edits]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;
  /*
   * A surface id that resolves to nothing is a dead link rather than an empty
   * screen. The ids are derived — `service.<slug>` follows the catalogue, so
   * deleting a service really does retire its content page — and a URL
   * somebody bookmarked before that has to say so.
   */
  if (!surface) notFound();

  const view = paginate(matching, page, PER_PAGE);

  /*
   * Read as a plain object rather than through `t()`, because a segment that
   * is not in the vocabulary is the normal case here — 859 of them occur once
   * — and asking next-intl for a key it does not have logs an error per field
   * and prints the key. The lookup has to be allowed to miss.
   */
  const words = ((messages as Record<string, unknown> | undefined)?.admin as
    | { website?: { words?: Record<string, string> } }
    | undefined)?.website?.words;

  const labelFor = (field: ContentField) => {
    if (field.labelKey) return t(`fields.${field.labelKey}` as 'fields.service.lead');
    const tail = field.tail ?? field.hint.split('.').pop() ?? field.hint;
    return words?.[tail] ?? humanise(tail);
  };

  /** The heading above a run of fields — `meta`, `hero`, `table`. */
  const sectionLabel = (section: string) => {
    const tail = section.split('.').pop() ?? section;
    return words?.[tail] ?? humanise(tail);
  };

  function write(field: ContentField, value: ContentValue) {
    setContent({
      key: field.key,
      kind: field.kind,
      locale,
      value,
      label: `${surface!.id} · ${labelFor(field)}`,
    });
  }

  return (
    <div>
      <PageHeader
        title={surface.name ?? t(`surfaces.${surface.nameKey}` as 'surfaces.page.home')}
        lead={t('detailLead')}
        back={{ href: '/admin/inhalte', label: t('back') }}
        actions={
          <div className="flex items-center gap-3">
            <SaveIndicator
              signal={content}
              savingLabel={appT('saving')}
              savedLabel={appT('saved')}
            />
            {surface.href && (
              <Button asChild variant="secondary" size="sm">
                <a href={surface.href} target="_blank" rel="noreferrer">
                  {t('rowView')}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </Button>
            )}
          </div>
        }
      />

      {surface.group === 'system' && (
        <p className="mt-6 flex max-w-[var(--measure)] items-start gap-2 rounded-[var(--radius-sm)] bg-sunken p-4 text-sm text-ink-secondary">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('interfaceNote')}
        </p>
      )}

      {/*
        Four tabs, not two. French and Italian have no dictionary at all — §20.6
        renders them as German — so they are the languages most in need of a
        place to be written, and leaving them off would make the screen agree
        with the gap instead of showing it.
      */}
      <div
        role="tablist"
        aria-label={t('localeTab')}
        className="mt-8 flex flex-wrap gap-1"
      >
        {routing.locales.map((id) => {
          const { gaps } = countSurface(surface, id, edits);
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`content-locale-${id}`}
              aria-selected={locale === id}
              aria-controls="content-panel"
              tabIndex={locale === id ? 0 : -1}
              onKeyDown={(e) => {
                const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (delta === 0) return;
                e.preventDefault();
                const all = routing.locales;
                const next = all[(all.indexOf(id) + delta + all.length) % all.length]!;
                setLocale(next);
                document.getElementById(`content-locale-${next}`)?.focus();
              }}
              onClick={() => {
                setLocale(id);
                setPage(1);
              }}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
                locale === id
                  ? 'bg-accent-subtle font-medium text-ink'
                  : 'text-ink-secondary hover:bg-sunken',
              )}
            >
              {LOCALE_LABELS[id]}
              {/* The count that makes tabbing safe. Without it, «ist Englisch
                  geschrieben?» costs a click and a scroll, and the answer for
                  a 300-string namespace is not visible even then. */}
              {gaps > 0 && (
                <span
                  data-numeric
                  className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-xs text-status-warning-fg"
                >
                  {gaps}
                </span>
              )}
              {!TRANSLATED_LOCALES.includes(id) && (
                <span className="sr-only">{t('sourceFallback')}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Only where it earns its place. Two blocks on a service page need no
          search; 331 interface strings cannot be worked through without one. */}
      {surface.fields.length > PER_PAGE && (
        <label className="mt-6 block max-w-md">
          <span className="sr-only">{t('search')}</span>
          <Input
            type="search"
            value={query}
            placeholder={t('searchPlaceholder')}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
      )}

      <div
        id="content-panel"
        role="tabpanel"
        aria-labelledby={`content-locale-${locale}`}
        tabIndex={0}
        className="mt-6 space-y-4"
      >
        {view.slice.length === 0 ? (
          <EmptyState
            headingLevel={2}
            title={t('emptyTitle')}
            body={t('emptyBody', { query: query.trim() })}
          />
        ) : (
          view.slice.map((field, index) => {
            const resolved = resolveContent(field, locale, edits);
            /*
             * A heading whenever the group changes, which needs no sorting: the
             * dictionary is already written in the order the page reads, so
             * `meta`, `hero` and `table` arrive in runs. Without it a page like
             * /preise is 47 boxes with nothing between them saying which part
             * of the page any of them is on.
             */
            const previous = index > 0 ? view.slice[index - 1]?.section ?? null : null;
            const heading =
              field.section && field.section !== previous ? field.section : null;

            return (
              <div key={field.key}>
                {heading && (
                  <h2 className="label-type mt-6 mb-3 text-ink-secondary first:mt-0">
                    {sectionLabel(heading)}
                  </h2>
                )}
                <ContentFieldEditor
                  field={field}
                  label={labelFor(field)}
                  value={resolved.value}
                  source={resolved.source}
                  onChange={(value) => write(field, value)}
                  onReset={resolved.source === 'edited' ? () => setPending(field) : null}
                />
              </div>
            );
          })
        )}
      </div>

      {view.pageCount > 1 && (
        <Pagination
          className="mt-6"
          page={view.page}
          pageCount={view.pageCount}
          onPageChange={setPage}
          label={appT('pageLabel')}
          previousLabel={appT('pagePrevious')}
          nextLabel={appT('pageNext')}
          summary={appT('pageSummary', { from: view.from, to: view.to, total: view.total })}
          note={appT('pagePerPage', { n: PER_PAGE })}
        />
      )}

      {/*
        Resetting asks, and editing does not. The asymmetry is deliberate: a
        keystroke is recoverable by typing, and «zurücksetzen» throws away work
        that has no other copy anywhere — the shipped text is in the repository,
        the edit is only in this store.
      */}
      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('resetTitle')}</DialogTitle>
            <DialogDescription>{t('resetBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPending(null)}>
              {actionsT('cancel')}
            </Button>
            <Button
              onClick={() => {
                if (!pending) return;
                resetContent(pending.key, locale);
                toast.success(t('resetDone'));
                setPending(null);
              }}
            >
              {t('resetLocale')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
