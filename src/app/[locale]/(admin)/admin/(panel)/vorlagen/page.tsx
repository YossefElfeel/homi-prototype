'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Mail, MessageSquare, Pencil, Plus, Star, Trash2 } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ConfirmPanel } from '@/components/ui/confirm-panel';
import { DataView, type Column } from '@/components/ui/data-view';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import {
  RowActions,
  RowAction,
  RowActionButton,
} from '@/components/ui/row-actions';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Toolbar } from '@/components/ui/toolbar';
import { useHydrated, useStore } from '@/mock/store';
import type { MessageTemplate, TemplateFlow } from '@/mock/schema';
import { TEMPLATE_FLOWS } from '@/mock/schema';
import {
  allTags,
  filledLocales,
  planDelete,
  searchTemplates,
  templateLabel,
} from '@/lib/templates';
import { SEED_SETTINGS } from '@/mock/seed';

/**
 * Screen 79 — message templates.
 *
 * Was a two-column editor over eleven fixed slots: a nav on the left, four
 * textareas on the right, and no way to add, remove or find anything. That
 * shape answered exactly one of the five things the brief asks for. Worse, it
 * hid the question an admin actually arrives with — not "what does the quote
 * mail say" but "which of these goes out when I send an invoice, and where do I
 * pick it". A list with search, filters and a visible default answers that; a
 * nav of eleven fixed labels cannot.
 *
 * Editing moved to `/admin/vorlagen/[id]`, following the coupon screens. The
 * list stopped being an editor the moment a template could be deleted: a
 * destructive action needs a confirm step, and a confirm step needs somewhere
 * to put the question — which an inline four-textarea panel does not have.
 */
export default function AdminTemplatesPage() {
  const t = useTranslations('admin.templates');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const templates = useStore((s) => s.settings.messageTemplates);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const setDefaultTemplate = useStore((s) => s.setDefaultTemplate);

  const [query, setQuery] = useState('');
  const [flow, setFlow] = useState<TemplateFlow | 'all'>('all');
  const [tag, setTag] = useState('');
  /* The template awaiting confirmation, plus the heir the admin picked for it.
     Held here rather than in ConfirmPanel so reading this file tells you the
     screen has a confirm step — the house rule for that component. */
  const [doomed, setDoomed] = useState<MessageTemplate | null>(null);
  const [heirId, setHeirId] = useState('');

  const tags = useMemo(() => allTags(templates), [templates]);
  const filtered = useMemo(
    () => searchTemplates(templates, locale, { query, flow, tag }),
    [templates, locale, query, flow, tag],
  );

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const eventLabel = (key: string) => t(`events.${key}` as 'events.offer-sent');
  const flowLabel = (f: TemplateFlow) => t(`flows.${f}` as 'flows.quotes');

  /* Which of the three delete conversations this is — asked of the same
     function the store will run, so the dialog cannot promise one outcome
     while the store performs another. */
  const siblings = doomed?.event
    ? templates.filter((x) => x.event === doomed.event && x.id !== doomed.id)
    : [];
  const deleteKind = doomed
    ? planDelete(templates, doomed.id, SEED_SETTINGS.messageTemplates, heirId || undefined).kind
    : 'missing';

  function confirmDelete() {
    if (!doomed) return;
    deleteTemplate(doomed.id, heirId || undefined);
    toast.success(deleteKind === 'restore' ? t('restoreDone') : t('deleteDone'));
    setDoomed(null);
    setHeirId('');
  }

  function promote(template: MessageTemplate) {
    setDefaultTemplate(template.id);
    toast.success(t('standardDone'));
  }

  const columns: Column<MessageTemplate>[] = [
    {
      key: 'subject',
      header: t('colSubject'),
      primary: true,
      sortBy: (x) => templateLabel(x, locale, ''),
      cell: (x) => (
        <span>
          <span className="block font-medium">
            {templateLabel(x, locale, t('untitled'))}
          </span>
          {/* What the row is *for*, in the row. The old nav said "Offerte
              versendet" and left "does this one actually go out?" to be
              answered by opening it. */}
          <span className="mt-1 block text-xs text-ink-tertiary">
            {x.event ? t('automaticOn', { event: eventLabel(x.event) }) : t('manual')}
          </span>
        </span>
      ),
    },
    {
      key: 'flow',
      header: t('colFlow'),
      sortBy: (x) => x.flow,
      cell: (x) => (
        <span className="flex flex-wrap items-center gap-1">
          <Chip tone="accent">{flowLabel(x.flow)}</Chip>
          {x.tags.map((one) => (
            <Chip key={one}>{one}</Chip>
          ))}
        </span>
      ),
    },
    {
      key: 'channels',
      header: t('colChannels'),
      tableOnly: true,
      cell: (x) => (
        <span className="flex items-center gap-2 text-xs text-ink-tertiary">
          {x.channels.includes('email') && (
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3" aria-hidden />
              {t('channelEmail')}
            </span>
          )}
          {x.channels.includes('sms') && (
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" aria-hidden />
              {t('channelSms')}
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'languages',
      header: t('colLanguages'),
      align: 'end',
      sortBy: (x) => filledLocales(x, routing.locales),
      cell: (x) => {
        const filled = filledLocales(x, routing.locales);
        const complete = filled === routing.locales.length;
        return (
          <Chip tone={complete ? 'neutral' : 'warning'}>
            {complete
              ? t('complete')
              : t('missing', { n: routing.locales.length - filled })}
          </Chip>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      trailing: true,
      align: 'end',
      cell: (x) => (
        <RowActions>
          {/* Only an event can have a default, and promoting the one that
              already holds the job is a control that does nothing. */}
          {x.event && !x.isDefault && (
            <RowActionButton label={t('makeStandard')} onClick={() => promote(x)}>
              <Star className="size-4" aria-hidden />
            </RowActionButton>
          )}
          <RowAction label={t('editAction')} href={`/admin/vorlagen/${x.id}`}>
            <Pencil className="size-4" aria-hidden />
          </RowAction>
          <RowActionButton
            label={t('deleteAction')}
            tone="danger"
            onClick={() => {
              setDoomed(x);
              setHeirId('');
            }}
          >
            <Trash2 className="size-4" aria-hidden />
          </RowActionButton>
        </RowActions>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('title')}
        lead={t('lead')}
        actions={
          <Button asChild>
            <Link href="/admin/vorlagen/neu">
              <Plus className="size-4" aria-hidden />
              {t('newAction')}
            </Link>
          </Button>
        }
      />

      {doomed && (
        <ConfirmPanel
          className="mb-app"
          title={
            deleteKind === 'restore'
              ? t('deleteLastTitle', { event: eventLabel(doomed.event ?? '') })
              : deleteKind === 'promote'
                ? t('deleteReplaceTitle')
                : t('deleteTitle')
          }
          body={
            deleteKind === 'restore'
              ? t('deleteLastBody', { event: eventLabel(doomed.event ?? '') })
              : deleteKind === 'promote'
                ? t('deleteReplaceBody', { event: eventLabel(doomed.event ?? '') })
                : t('deleteBody')
          }
          action={
            deleteKind === 'restore' ? t('deleteLastConfirm') : t('deleteConfirm')
          }
          dismiss={t('deleteCancel')}
          /* Which template inherits the automatic send is a business decision,
             so it is asked here rather than guessed in the store. */
          disabled={deleteKind === 'promote' && !heirId}
          onConfirm={confirmDelete}
          onDismiss={() => {
            setDoomed(null);
            setHeirId('');
          }}
        >
          {deleteKind === 'promote' && (
            <Field label={t('deleteReplaceLabel')} className="max-w-sm">
              {(props) => (
                <Select
                  {...props}
                  dense
                  value={heirId}
                  onChange={(e) => setHeirId(e.target.value)}
                >
                  <option value="">—</option>
                  {siblings.map((one) => (
                    <option key={one.id} value={one.id}>
                      {templateLabel(one, locale, t('untitled'))}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </ConfirmPanel>
      )}

      <Toolbar
        search={{
          value: query,
          onChange: setQuery,
          label: t('searchLabel'),
          placeholder: t('searchPlaceholder'),
        }}
        count={t('count', { n: filtered.length, total: templates.length })}
        filters={
          <>
            <Field label={t('filterFlow')} className="min-w-44">
              {(props) => (
                <Select
                  {...props}
                  dense
                  value={flow}
                  onChange={(e) => setFlow(e.target.value as TemplateFlow | 'all')}
                >
                  <option value="all">{t('filterAll')}</option>
                  {TEMPLATE_FLOWS.map((one) => (
                    <option key={one} value={one}>
                      {flowLabel(one)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {/* Only offered once a tag exists — an empty filter is a control
                that cannot change anything. */}
            {tags.length > 0 && (
              <Field label={t('filterTag')} className="min-w-44">
                {(props) => (
                  <Select
                    {...props}
                    dense
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  >
                    <option value="">{t('filterAll')}</option>
                    {tags.map((one) => (
                      <option key={one} value={one}>
                        {one}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
          </>
        }
      />

      <DataView
        items={filtered}
        columns={columns}
        getKey={(x) => x.id}
        onSelect={(x) => router.push(`/admin/vorlagen/${x.id}`)}
        caption={t('title')}
        empty={
          <EmptyState
            title={t('emptyTitle')}
            body={t('emptyBody')}
            headingLevel={2}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('');
                  setFlow('all');
                  setTag('');
                }}
              >
                {t('emptyAction')}
              </Button>
            }
          />
        }
      />

      <p className="mt-6 text-sm text-ink-tertiary">{t('fallbackNote')}</p>
    </div>
  );
}
