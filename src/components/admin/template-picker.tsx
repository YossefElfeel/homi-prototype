'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil, Send, Settings2 } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, Select } from '@/components/ui/field';
import { useStore } from '@/mock/store';
import type { MessageTemplate, TemplateFlow } from '@/mock/schema';
import {
  AUTOMATIC_ONLY,
  fillTemplate,
  pickable,
  templateLabel,
  type TemplateVars,
} from '@/lib/templates';

/**
 * The template dropdown, once, for every screen that sends something.
 *
 * Three screens had grown three different answers to "offer the owner a
 * template here". The messages screen listed all eleven events including the
 * two that fire on their own, so picking one meant the customer heard the
 * cleaner was on the way twice. The quote builder hard-coded a single option.
 * The invoice screen had nothing at all, which is why `invoice-sent` and
 * `payment-reminder` sat in settings for the whole life of the prototype
 * without a single reader — an invoice went out with no covering text.
 *
 * It also changes what picking a template *does*. The old pickers inserted raw
 * text and left `{name}` standing, on the reasoning that a half-filled
 * placeholder reaching a customer is worse than retyping the sentence. True,
 * and unavoidable while nothing resolved placeholders. Here the caller passes
 * `vars` from the record on screen — the invoice knows its number, amount and
 * due date — so the preview shows the finished message and one-click send is
 * safe. When a placeholder has no source, `unresolved` is non-empty, direct
 * send is disabled and only "edit before sending" remains: the old rule, now
 * enforced rather than trusted.
 */
export function TemplatePicker({
  flow,
  /** The language the *customer* reads, not the language the admin works in. */
  locale,
  vars,
  onInsert,
  onSend,
  hasDraft,
  className,
}: {
  /**
   * Omitted by the messages screen, which is not one flow's screen — a thread
   * about a quote and a thread about an invoice sit in the same list, so
   * narrowing it there would hide the template the reply actually needs.
   */
  flow?: TemplateFlow;
  locale: Locale;
  vars: TemplateVars;
  /** Put the text in the composer so it can be changed before it goes. */
  onInsert: (message: { subject: string; body: string }) => void;
  /**
   * Send it as previewed. Omitted by screens where sending is a separate,
   * heavier act — the quote builder writes a covering letter, it does not send
   * a message — and those show only the insert path.
   */
  onSend?: (message: { subject: string; body: string }) => void;
  /** Whether the composer already holds something worth confirming over. */
  hasDraft?: boolean;
  className?: string;
}) {
  const t = useTranslations('admin.templatePicker');
  const templates = useStore((s) => s.settings.messageTemplates);
  const [selectedId, setSelectedId] = useState('');

  const options = pickable(templates, { flow, exclude: AUTOMATIC_ONLY });
  const selected = options.find((o) => o.id === selectedId);

  if (options.length === 0) {
    return (
      <Alert tone="neutral" className={className}>
        {t('empty')}{' '}
        <Link href="/admin/vorlagen" className="underline underline-offset-2">
          {t('manage')}
        </Link>
      </Alert>
    );
  }

  const filled = selected ? fillTemplate(selected, locale, vars) : null;
  const blocked = (filled?.unresolved.length ?? 0) > 0;

  function take(template: MessageTemplate, send: boolean) {
    const message = fillTemplate(template, locale, vars);
    const payload = { subject: message.subject.text, body: message.body.text };
    if (send) {
      onSend?.(payload);
      toast.success(t('sentDone'));
    } else {
      /* Only the insert path can destroy work in progress — sending replaces
         nothing. */
      if (hasDraft && !window.confirm(t('overwrite'))) return;
      onInsert(payload);
      toast.success(t('insertDone'));
    }
    setSelectedId('');
  }

  return (
    <div className={className}>
      <Field label={t('label')}>
        {(props) => (
          <Select
            {...props}
            dense
            className="max-w-sm"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">{t('placeholder')}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {templateLabel(option, locale, t('placeholder'))}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {selected && filled && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-line-subtle bg-sunken p-4">
          <h4 className="label-type text-ink-tertiary">{t('previewTitle')}</h4>

          {filled.subject.text.trim() && (
            <p className="mt-2 text-sm">
              <span className="text-ink-tertiary">{t('subjectLabel')}: </span>
              <span className="font-medium">{filled.subject.text}</span>
            </p>
          )}

          {/* The preview is the whole safety argument for one-click send: what
              is shown here is byte-for-byte what leaves. */}
          <p className="mt-2 max-w-[var(--measure)] text-sm whitespace-pre-line">
            {filled.body.text}
          </p>

          {blocked ? (
            <Alert tone="warning" title={t('unresolvedTitle')} className="mt-4">
              {t('unresolvedBody', {
                fields: filled.unresolved.map((f) => `{${f}}`).join(', '),
              })}
            </Alert>
          ) : (
            <p className="mt-3 text-xs text-ink-tertiary">{t('resolvedNote')}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {onSend && (
              <Button size="sm" disabled={blocked} onClick={() => take(selected, true)}>
                <Send className="size-4" aria-hidden />
                {t('sendDirect')}
              </Button>
            )}
            <Button
              size="sm"
              variant={onSend ? 'secondary' : 'primary'}
              onClick={() => take(selected, false)}
            >
              <Pencil className="size-4" aria-hidden />
              {t('editFirst')}
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/vorlagen">
                <Settings2 className="size-4" aria-hidden />
                {t('manage')}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
