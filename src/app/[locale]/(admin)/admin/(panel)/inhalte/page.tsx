'use client';

import { useCallback, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { AlertTriangle, Download, Info } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { RowAction, RowActions } from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Toolbar } from '@/components/ui/toolbar';
import { ActionIcon } from '@/lib/action-icons';
import {
  CONTENT_GROUPS,
  contentExport,
  contentText,
  contentSurfaces,
  countSurface,
  editMap,
  resolveContent,
  servicesWithoutCopy,
  type ContentGroup,
  type ContentSurface,
} from '@/lib/content-registry';
import { downloadBlob } from '@/lib/pdf';
import { useHydrated, useNow, useStore } from '@/mock/store';

type GroupFilter = 'all' | ContentGroup;
type StateFilter = 'all' | 'edited' | 'gaps';

const GROUP_LABEL: Record<ContentGroup, string> = {
  services: 'groupServices',
  pages: 'groupPages',
  legal: 'groupLegal',
  flows: 'groupFlows',
  system: 'groupSystem',
};

/**
 * Screen 85 — the website, as a list of places text lives.
 *
 * Every other screen in this panel is about a record the business keeps: a
 * customer, a job, an invoice. This one is about the *product's own words*, and
 * until now nobody in the company could change one. The homepage, the seven
 * service pages, the three legal documents and every button label were frozen
 * imports — so «schreib das anders» was a developer ticket, and the comment in
 * `content/services.ts` promising an admin screen «pro Sprache bearbeitbar»
 * (§17.2) had been an intention since wave 1.
 *
 * Two things the board is careful about.
 *
 * **It counts gaps, not fields.** §20.6 makes German the fallback, which means
 * an untranslated English page renders German and looks finished. A column of
 * «12 Bausteine» would have told the reader nothing they did not already
 * assume; the column that matters is how many of them are quietly showing the
 * wrong language, and it is counted for whichever language the reader is
 * currently in.
 *
 * **It says the site is static, at the top, in the lead.** The panel takes the
 * edit immediately and a visitor sees it at the next deploy. Putting that in a
 * footnote would make the screen a box that swallows work — so it is the first
 * sentence, and the export button beside it is the hand-off it implies.
 */
export default function WebsiteContentPage() {
  const t = useTranslations('admin.website');
  const blogT = useTranslations('admin.blog');
  const appT = useTranslations('app');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const now = useNow();

  const services = useStore((s) => s.services);
  const content = useStore((s) => s.content);
  const posts = useStore((s) => s.data.posts);

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<GroupFilter>('all');
  const [state, setState] = useState<StateFilter>('all');

  const edits = useMemo(() => editMap(content), [content]);
  const surfaces = useMemo(
    () => contentSurfaces(services, locale),
    [services, locale],
  );

  /* A service names itself from its record; a page is named in the dictionary.
     Both end up as one string here so nothing downstream has to know which
     kind of surface it is holding. */
  const nameOf = useCallback(
    (surface: ContentSurface) =>
      surface.name ?? t(`surfaces.${surface.nameKey}` as 'surfaces.page.home'),
    [t],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return surfaces
      .filter((surface) => (group === 'all' ? true : surface.group === group))
      .filter((surface) => {
        if (state === 'all') return true;
        const counts = countSurface(surface, locale, edits);
        return state === 'edited' ? counts.edited > 0 : counts.gaps > 0;
      })
      .filter((surface) => {
        if (!q) return true;
        if (nameOf(surface).toLowerCase().includes(q)) return true;
        if (surface.id.toLowerCase().includes(q)) return true;
        if (surface.href?.toLowerCase().includes(q)) return true;
        /*
         * The search reads the copy itself, not only the names.
         *
         * «wo steht eigentlich Abnahmegarantie» is the question this screen is
         * opened with, and a search over thirty-three surface names cannot
         * answer it — the answer is a sentence inside one of four thousand
         * blocks. Reading the resolved value means it also finds text somebody
         * has *changed to*, which is the half a grep over the source misses.
         */
        return surface.fields.some((field) => {
          if (field.hint.toLowerCase().includes(q)) return true;
          return contentText(resolveContent(field, locale, edits).value)
            .toLowerCase()
            .includes(q);
        });
      });
  }, [surfaces, group, state, query, locale, edits, nameOf]);

  const uncopied = useMemo(
    () => servicesWithoutCopy(services, locale, edits),
    [services, locale, edits],
  );

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const filtering = group !== 'all' || state !== 'all' || query.trim() !== '';

  function exportEdits() {
    if (content.length === 0) {
      toast.error(t('exportEmpty'));
      return;
    }
    downloadBlob(
      `homivaro-texte-${now.toISOString().slice(0, 10)}.json`,
      new Blob([contentExport(content, now)], { type: 'application/json' }),
    );
    toast.success(t('exportDone', { n: content.length }));
  }

  const columns: Column<ContentSurface>[] = [
    {
      key: 'name',
      header: t('colSurface'),
      primary: true,
      sortBy: (surface) => nameOf(surface),
      cell: (surface) => (
        <span className="flex flex-wrap items-baseline gap-2">
          {nameOf(surface)}
          {/* The route, beside the name. It is what the designer opening the
              prototype actually needs — «wo ist das» is answered by a URL and
              not by a surface id — and it doubles as the search term the
              office already knows. */}
          {surface.href && (
            <span className="font-mono text-xs text-ink-tertiary">{surface.href}</span>
          )}
          {surface.scope === 'panel' && (
            <span className="rounded-sm border border-line px-1.5 py-0.5 text-xs text-ink-tertiary">
              {t('scopePanel')}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'group',
      header: t('colGroup'),
      sortBy: (surface) => surface.group,
      cell: (surface) => (
        <span className="text-ink-secondary">{t(GROUP_LABEL[surface.group])}</span>
      ),
    },
    {
      key: 'fields',
      header: t('colFields'),
      align: 'end',
      sortBy: (surface) => surface.fields.length,
      cell: (surface) => (
        <span data-numeric className="text-ink-secondary">
          {surface.fields.length}
        </span>
      ),
    },
    {
      key: 'edited',
      header: t('colEdited'),
      align: 'end',
      sortBy: (surface) => countSurface(surface, locale, edits).edited,
      cell: (surface) => {
        const { edited } = countSurface(surface, locale, edits);
        return edited === 0 ? (
          <span className="text-sm text-ink-tertiary">—</span>
        ) : (
          <span data-numeric>{edited}</span>
        );
      },
    },
    {
      /* Counted for the language the reader is in, and the header says which.
         A gap count with no language on it is the one number on this screen
         that would read as a defect in the copy rather than as a missing
         translation. */
      key: 'gaps',
      header: t('colGaps', { locale: LOCALE_LABELS[locale] }),
      align: 'end',
      trailing: true,
      sortBy: (surface) => countSurface(surface, locale, edits).gaps,
      cell: (surface) => {
        const { gaps } = countSurface(surface, locale, edits);
        return gaps === 0 ? (
          <span className="text-sm text-ink-tertiary">—</span>
        ) : (
          <span className="rounded-sm border border-status-warning-line bg-status-warning px-1.5 py-0.5 text-xs text-status-warning-fg">
            {gaps}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          <Button variant="secondary" onClick={exportEdits}>
            <Download className="size-4" aria-hidden />
            {t('exportAction')}
          </Button>
        }
      />

      <p className="mt-6 flex max-w-[var(--measure)] items-start gap-2 rounded-[var(--radius-sm)] bg-sunken p-4 text-sm text-ink-secondary">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('staticNote')}
      </p>

      {/*
        The Ratgeber is the one part of the website that is *records* rather
        than fields, so it cannot be a row in the table below — a table of
        surfaces has nowhere to put "and there are nine of these, and you can
        write a tenth". It gets a card instead, above the board, because
        writing an article is the thing somebody comes to this screen to do
        most often after fixing a sentence.
      */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-sm)] border border-line-subtle p-5">
        <div>
          <h2 className="font-medium">{blogT('boardTitle')}</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            {blogT('boardBody', {
              n: posts.length,
              drafts: posts.filter((post) => post.status === 'draft').length,
            })}
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/admin/inhalte/ratgeber">{blogT('boardAction')}</Link>
        </Button>
      </div>

      {/*
        The one warning on this screen that is about the product rather than
        about the text: a service that is on sale, has a price, and has nothing
        to put on a page. It is what §17.2a is actually about — the catalogue
        could be added to long before the copy could, so an owner could publish
        a service the marketing site cannot build a page for and nothing
        anywhere said so.
      */}
      {uncopied.length > 0 && (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-status-warning-line bg-status-warning p-4">
          <p className="flex items-start gap-2 font-medium text-status-warning-fg">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('missingCopyTitle', { n: uncopied.length })}
          </p>
          <p className="mt-2 max-w-[var(--measure)] text-sm text-status-warning-fg">
            {t('missingCopyBody', {
              names: uncopied.map((service) => service.name[locale]).join(', '),
            })}
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link href={`/admin/inhalte/service.${uncopied[0]!.slug}`}>
              {t('missingCopyAction')}
            </Link>
          </Button>
        </div>
      )}

      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('search'),
          placeholder: t('searchPlaceholder'),
          clearLabel: appT('clearSearch'),
        }}
        count={
          filtering
            ? appT('results', { shown: visible.length, total: surfaces.length })
            : appT('resultsAll', { total: surfaces.length })
        }
        filters={
          <>
            <label className="min-w-44">
              <span className="sr-only">{t('filterGroup')}</span>
              <Select
                dense
                value={group}
                onChange={(e) => setGroup(e.target.value as GroupFilter)}
              >
                <option value="all">
                  {t('filterGroup')}: {t('filterAll')}
                </option>
                {CONTENT_GROUPS.map((id) => (
                  <option key={id} value={id}>
                    {t('filterGroup')}: {t(GROUP_LABEL[id])}
                  </option>
                ))}
              </Select>
            </label>
            <label className="min-w-44">
              <span className="sr-only">{t('filterState')}</span>
              <Select
                dense
                value={state}
                onChange={(e) => setState(e.target.value as StateFilter)}
              >
                <option value="all">
                  {t('filterState')}: {t('filterAll')}
                </option>
                <option value="edited">
                  {t('filterState')}: {t('filterEdited')}
                </option>
                <option value="gaps">
                  {t('filterState')}: {t('filterGaps')}
                </option>
              </Select>
            </label>
          </>
        }
        className="mt-8"
      />

      <DataView
        className="mt-4"
        items={visible}
        columns={columns}
        getKey={(surface) => surface.id}
        caption={t('title')}
        openLabel={t('rowOpen')}
        /* Twenty-five rather than the usual ten. This board is a directory
           somebody scans for a page name, not a queue they work through — and
           at ten, thirty-three surfaces are four pages of paging to find the
           homepage. */
        perPage={25}
        rowActions={(surface) => (
          <RowActions>
            <RowAction href={`/admin/inhalte/${surface.id}`} label={t('rowOpen')}>
              <ActionIcon.edit aria-hidden />
            </RowAction>
            {surface.href && (
              <RowAction external href={surface.href} label={t('rowView')}>
                <ActionIcon.customerView aria-hidden />
              </RowAction>
            )}
          </RowActions>
        )}
        empty={
          <EmptyState
            title={t('emptyTitle')}
            body={t('emptyBody', { query: query.trim() })}
          />
        }
      />
    </div>
  );
}
