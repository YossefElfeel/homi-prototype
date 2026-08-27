'use client';

import { use, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExternalLink, Info, Mail, MessageSquare } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS, type Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { useHydrated, useStore } from '@/mock/store';
import type {
  MessageTemplate,
  MessageTemplateKey,
  TemplateChannel,
  TemplateFlow,
} from '@/mock/schema';
import { TEMPLATE_FLOWS } from '@/mock/schema';
import {
  CHANNELS,
  PLACEHOLDERS,
  SMS_LIMIT,
  USAGE,
  textFor,
} from '@/lib/templates';

const EVENT_KEYS: MessageTemplateKey[] = [
  'request-received',
  'offer-sent',
  'offer-reminder',
  'booking-confirmed',
  'appointment-reminder',
  'on-the-way',
  'job-done',
  'invoice-sent',
  'payment-reminder',
  'cancellation',
  'review-request',
];

/**
 * Screen 79a — creating or editing a template.
 *
 * `/admin/vorlagen/neu` opens the same form empty, following the coupon
 * screens: one route, one layout, so a "new" screen cannot drift from the edit
 * screen.
 *
 * All four languages on one screen rather than behind a switcher, which is the
 * decision the old screen made and the only one worth keeping from it. German
 * is the fallback (§20.6), so a missing translation sends successfully and
 * never complains — the gap has to be visible here or it is visible nowhere.
 *
 * The usage panel is the brief's last point answered structurally. It reads
 * `USAGE` in `lib/templates.ts`, the same table the pickers read to decide what
 * they offer, so "used in Invoices" cannot become a lie while the picker still
 * says otherwise. That was the design and not what shipped: `USAGE` listed
 * Nachrichten under every flow, a screen with no picker at all, so the panel
 * had been lying on every template it could show. The table now holds only the
 * two screens that mount `TemplatePicker`, and the panel leads with the
 * channels — a fact that comes off the record rather than a registry.
 */
export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.template');
  const listT = useTranslations('admin.templates');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();

  const templates = useStore((s) => s.settings.messageTemplates);
  const addTemplate = useStore((s) => s.addTemplate);
  const updateTemplate = useStore((s) => s.updateTemplate);

  const isNew = id === 'neu';
  /* The new template lives here until it is saved. An existing one autosaves
     straight into the store like every other settings screen, so `pending`
     only ever holds the unsaved case. */
  const [pending, setPending] = useState<MessageTemplate | null>(null);
  /* Which body textarea last had focus, so "insert placeholder" knows which
     language it is writing into. Without it the button would have to guess,
     and guessing German would put a German-shaped edit into the Italian box. */
  const [activeLocale, setActiveLocale] = useState<Locale>('de');

  if (!hydrated) return <SkeletonPage label={listT('title')} />;

  const existing = templates.find((x) => x.id === id);
  const template: MessageTemplate =
    pending ??
    existing ?? {
      /* Empty until save. `Date.now()` here runs during render, so the draft's
         id changed on every keystroke — and React's purity rule catches it
         precisely because an id that moves under you is the kind of bug that
         shows up later as a duplicate row. */
      id: '',
      flow: 'general',
      tags: [],
      subject: {},
      body: {},
      channels: ['email'],
      /* A new template never steals the automatic send from the one already
         doing the job. Promoting it is a separate, deliberate act on the
         list. */
      isDefault: false,
    };

  if (!isNew && !existing) {
    return (
      <div>
        <PageHeader
          title={listT('emptyTitle')}
          back={{ href: '/admin/vorlagen', label: t('back') }}
        />
        <Alert tone="warning">{listT('emptyTitle')}</Alert>
      </div>
    );
  }

  function patch(next: Partial<MessageTemplate>) {
    const merged = { ...template, ...next };
    setPending(merged);
    if (!isNew) updateTemplate(template.id, next);
  }

  function save() {
    if (isNew) {
      addTemplate({ ...template, id: `tpl_${Date.now().toString(36)}` });
      toast.success(t('createdDone'));
    } else {
      toast.success(t('savedDone'));
    }
    router.push('/admin/vorlagen');
  }

  function insertPlaceholder(name: string) {
    patch({
      body: {
        ...template.body,
        [activeLocale]: `${template.body[activeLocale] ?? ''}{${name}}`,
      },
    });
  }

  const germanMissing = !(template.body.de ?? '').trim();
  const subjectMissing = !(template.subject.de ?? '').trim();
  const usage = USAGE[template.flow];

  return (
    <div>
      <PageHeader
        title={
          isNew
            ? t('newTitle')
            : textFor(template.subject, locale) || listT('untitled')
        }
        back={{ href: '/admin/vorlagen', label: t('back') }}
      />

      <div className="gap-app grid lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        {/*
          The form is on a card now.

          It was laid straight onto the page background while the two panels
          beside it were cards — so the only surfaces on this screen were the
          reference material, and the fields an admin came here to fill in read
          as the gap between them. Every other edit screen in the panel puts its
          fields on a card, and this one claims in its own header to follow the
          coupon screens.

          Two cards rather than one, split where the coupon screen splits: what
          the template *is* above, what it *says* below. The language blocks are
          the long part, and a single card would put the flow select and the
          Italian textarea inside one unbroken box.
        */}
        <div className="space-y-app-section">
          <Card>
            <CardHeader
              title={t('sectionSetupTitle')}
              description={t('sectionSetupHint')}
            />
            <CardBody className="space-y-5">
              <Field label={t('flowLabel')} hint={t('flowHint')}>
                {(props) => (
                  <Select
                    {...props}
                    value={template.flow}
                    onChange={(e) =>
                      patch({ flow: e.target.value as TemplateFlow })
                    }
                  >
                    {TEMPLATE_FLOWS.map((one) => (
                      <option key={one} value={one}>
                        {listT(`flows.${one}` as 'flows.quotes')}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label={t('eventLabel')} hint={t('eventHint')}>
                {(props) => (
                  <Select
                    {...props}
                    value={template.event ?? ''}
                    onChange={(e) =>
                      patch({
                        event: (e.target.value || undefined) as
                          | MessageTemplateKey
                          | undefined,
                      })
                    }
                  >
                    <option value="">{t('eventNone')}</option>
                    {EVENT_KEYS.map((one) => (
                      <option key={one} value={one}>
                        {listT(`events.${one}` as 'events.offer-sent')}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <fieldset>
                <legend className="text-sm font-medium">
                  {t('channelsLabel')}
                </legend>
                <div className="mt-2 flex flex-wrap gap-4">
                  {CHANNELS.map((channel) => (
                    <Checkbox
                      key={channel}
                      label={listT(
                        channel === 'email' ? 'channelEmail' : 'channelSms',
                      )}
                      checked={template.channels.includes(channel)}
                      onChange={(e) =>
                        patch({
                          channels: e.target.checked
                            ? [...template.channels, channel]
                            : template.channels.filter(
                                (c: TemplateChannel) => c !== channel,
                              ),
                        })
                      }
                    />
                  ))}
                </div>
              </fieldset>

              <Field label={t('tagsLabel')} hint={t('tagsHint')}>
                {(props) => (
                  <Input
                    {...props}
                    value={template.tags.join(', ')}
                    onChange={(e) =>
                      patch({
                        tags: e.target.value
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                )}
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={t('sectionTextTitle')}
              description={t('sectionTextHint')}
            />
            <CardBody className="space-y-6">
              {germanMissing && (
                <Alert tone="warning" title={t('requiredTitle')}>
                  {t('requiredBody')}
                </Alert>
              )}

              {routing.locales.map((l) => {
                const body = template.body[l] ?? '';
                const smsOverrun =
                  template.channels.includes('sms') && body.length > SMS_LIMIT;
                return (
                  <div
                    key={l}
                    className="space-y-3 border-t border-line-subtle pt-6 first:border-0 first:pt-0"
                  >
                    <h3 className="display-type text-lg">{LOCALE_LABELS[l]}</h3>

                    <Field
                      label={t('subjectLabel')}
                      hint={
                        l === 'de' && subjectMissing
                          ? t('subjectMissing')
                          : undefined
                      }
                    >
                      {(props) => (
                        <Input
                          {...props}
                          value={template.subject[l] ?? ''}
                          onChange={(e) =>
                            patch({
                              subject: {
                                ...template.subject,
                                [l]: e.target.value,
                              },
                            })
                          }
                        />
                      )}
                    </Field>

                    <Field
                      label={t('bodyLabel')}
                      hint={body.trim() ? undefined : listT('emptyForLocale')}
                      error={
                        smsOverrun
                          ? listT('smsWarning', { limit: SMS_LIMIT })
                          : undefined
                      }
                    >
                      {(props) => (
                        <Textarea
                          {...props}
                          rows={body.trim() ? 7 : 3}
                          value={body}
                          onFocus={() => setActiveLocale(l)}
                          onChange={(e) =>
                            patch({
                              body: { ...template.body, [l]: e.target.value },
                            })
                          }
                        />
                      )}
                    </Field>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button onClick={save}>{t('saveAction')}</Button>
            <Button asChild variant="ghost">
              <Link href="/admin/vorlagen">{listT('deleteCancel')}</Link>
            </Button>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="surface-card p-5">
            <h2 className="label-type text-ink-tertiary">{t('placeholderTitle')}</h2>
            <p className="mt-2 text-sm text-ink-secondary">{t('placeholderNote')}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => insertPlaceholder(name)}
                  title={t('placeholderInsert')}
                  className="rounded-[var(--radius-xs)] border border-line-subtle px-1.5 py-0.5 font-mono text-2xs text-ink-secondary transition-colors hover:bg-sunken hover:text-ink"
                >
                  {`{${name}}`}
                </button>
              ))}
            </div>
          </div>

          {/*
            The brief's fifth point — which had been answered with a screen that
            cannot serve a template.

            Every flow's USAGE row led with Nachrichten, so this panel sent the
            admin off to pick their text on screen 48. Screen 48 has no picker,
            and says why in its own header: one thread there can be about a
            request, a quote or an invoice at once. Following the link left you
            hunting for a control that was never built.

            So the panel leads with the channels instead. That answer is true of
            every template, it comes off the record in front of you rather than
            a table of screens, and it is what an admin is actually checking
            before they save — an SMS-only template with 400 characters in it
            bills as two messages, and the field above already says so.
          */}
          <div className="surface-card p-5">
            <h2 className="label-type text-ink-tertiary">{listT('usageTitle')}</h2>
            <p className="mt-2 flex items-start gap-2 text-sm text-ink-secondary">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {listT('usageNote')}
            </p>

            <p className="label-type mt-4 text-ink-tertiary">
              {listT('usageChannels')}
            </p>
            {template.channels.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {template.channels.includes('email') && (
                  <Chip icon={Mail}>{listT('channelEmail')}</Chip>
                )}
                {template.channels.includes('sms') && (
                  <Chip icon={MessageSquare}>{listT('channelSms')}</Chip>
                )}
              </div>
            ) : (
              /* Both boxes unticked is reachable from the fieldset above, so it
                 gets a sentence rather than an empty row that reads as a
                 rendering fault. */
              <p className="mt-1.5 text-sm text-status-warning-fg">
                {listT('usageNoChannels')}
              </p>
            )}

            <p className="label-type mt-4 text-ink-tertiary">
              {listT('usageScreens')}
            </p>
            {usage.length > 0 ? (
              <ul className="mt-1.5 space-y-1.5">
                {usage.map((one) => (
                  <li key={one.key}>
                    <Link
                      href={one.href}
                      className="inline-flex items-center gap-1.5 text-sm underline underline-offset-2 hover:text-ink-accent"
                    >
                      {listT(`usage.${one.key}` as 'usage.quote')}
                      <ExternalLink className="size-3.5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-ink-secondary">
                {template.event ? listT('usageNoScreens') : listT('usageUnused')}
              </p>
            )}

            {template.event && (
              <p className="mt-4 border-t border-line-subtle pt-3 text-sm text-ink-secondary">
                {listT('automaticOn', {
                  event: listT(`events.${template.event}` as 'events.offer-sent'),
                })}
                {template.isDefault && (
                  <Chip tone="success" className="ms-2">
                    {listT('standard')}
                  </Chip>
                )}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
