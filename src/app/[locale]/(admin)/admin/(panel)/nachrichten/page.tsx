'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MessageSquare, Search, Send, X } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { MessageAttachment } from '@/mock/schema';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Toolbar } from '@/components/ui/toolbar';
import { AttachmentPicker } from '@/components/messages/attachment-picker';
import { MessageAttachments } from '@/components/messages/message-attachments';
import { elapsed } from '@/lib/elapsed';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/**
 * The admin half of screen 48 — new.
 *
 * `data.messages` had exactly three readers: the customer's own screen, the
 * selector behind it, and the account shell's unread badge. Nothing in the
 * panel touched it. A customer could write a reply, the store would keep it
 * faithfully, and no one would ever see it.
 *
 * Threaded by `subject` — the reference the conversation hangs off — for the
 * same reason the customer side is: a message about job B-1052 belongs with
 * job B-1052, not with whatever else arrived that afternoon.
 *
 * The reply is typed, not picked. The shared template picker stays on the
 * quote and invoice screens, where the screen knows which flow it is in and
 * therefore which template is the right one; a thread here can be about a
 * request, a quote or an invoice, and a picker that cannot tell them apart
 * offers the wrong text as readily as the right one.
 *
 * Two chips, not one. This screen shipped with a single chip reading
 * «Ungelesen» that was computed from who wrote last, so the two questions an
 * owner actually asks — "what have I not looked at" and "what still owes a
 * reply" — had one answer between them. A thread read and deliberately parked
 * until tomorrow stayed marked unread for ever. `readByAdmin` answers the
 * first, who wrote last answers the second, and the filter above the list
 * works off the first because that is what Read/Unread means everywhere else.
 */
type ReadFilter = 'all' | 'unread' | 'read';

export default function AdminMessagesPage() {
  const t = useTranslations('admin.messages');
  const appT = useTranslations('app');
  const locale = useLocale() as Locale;
  const now = useNow();
  const hydrated = useHydrated();

  const messages = useStore((s) => s.data.messages);
  const customers = useStore((s) => s.data.customers);
  const sendMessage = useStore((s) => s.sendMessage);
  const markThreadRead = useStore((s) => s.markThreadRead);

  const [query, setQuery] = useState('');
  const [read, setRead] = useState<ReadFilter>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  /* Both keyed by thread. One shared draft across threads is the bug the
     customer side shipped with — typing in one wrote into all of them — and an
     attachment staged against the wrong conversation is the same mistake with
     a file in it. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [staged, setStaged] = useState<Record<string, MessageAttachment[]>>({});

  const nameOf = (id: string) => {
    const c = customers.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  const threads = useMemo(() => {
    const map = new Map<
      string,
      { key: string; customerId: string; subject: string; items: typeof messages }
    >();

    for (const message of messages) {
      const key = `${message.customerId}::${message.subject}`;
      const thread = map.get(key);
      if (thread) thread.items.push(message);
      else
        map.set(key, {
          key,
          customerId: message.customerId,
          subject: message.subject,
          items: [message],
        });
    }

    return [...map.values()]
      .map((thread) => ({
        ...thread,
        items: [...thread.items].sort((a, b) => a.at.localeCompare(b.at)),
      }))
      .sort((a, b) =>
        (b.items.at(-1)?.at ?? '').localeCompare(a.items.at(-1)?.at ?? ''),
      );
  }, [messages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    /* <input type="date"> gives YYYY-MM-DD and `at` is a full ISO string, so
       comparing the first ten characters keeps the range on calendar days
       instead of drifting by a timezone offset — the same rule the request
       queue uses. The range is read against the thread's newest message,
       because that is the date the row shows and the date it sorts by; a range
       run against the opening message would hide a conversation that started
       in March and is still live. */
    const fromKey = from || null;
    const toKey = to || null;

    return threads
      .filter((thread) => (read === 'all' ? true : isUnread(thread.items) === (read === 'unread')))
      .filter((thread) => {
        const day = (thread.items.at(-1)?.at ?? '').slice(0, 10);
        return (!fromKey || day >= fromKey) && (!toKey || day <= toKey);
      })
      .filter(
        (thread) =>
          !q ||
          thread.subject.toLowerCase().includes(q) ||
          nameOf(thread.customerId).toLowerCase().includes(q),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, query, read, from, to, customers]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /*
   * Resolved against every thread, not just the surviving ones.
   *
   * Opening an unread thread marks it read, which under the Unread filter
   * drops it out of the list on the same click — and if `open` were read off
   * the filtered set, the transcript would vanish from under whoever just
   * clicked it. The list narrows; what you are reading stays put.
   */
  const open = threads.find((thread) => thread.key === openKey) ?? filtered[0] ?? null;
  const filtering = Boolean(query || from || to || read !== 'all');

  const attachmentsFor = (key: string) => staged[key] ?? [];
  const canSend = (key: string) =>
    Boolean((drafts[key] ?? '').trim()) || attachmentsFor(key).length > 0;

  function reset() {
    setQuery('');
    setRead('all');
    setFrom('');
    setTo('');
  }

  function selectThread(key: string, customerId: string, subject: string) {
    setOpenKey(key);
    markThreadRead(customerId, subject, 'admin');
  }

  function reply() {
    if (!open || !canSend(open.key)) return;

    sendMessage(
      {
        customerId: open.customerId,
        subject: open.subject,
        body: (drafts[open.key] ?? '').trim(),
        from: 'homivaro',
        attachments: attachmentsFor(open.key),
      },
      now,
    );
    setDrafts((d) => ({ ...d, [open.key]: '' }));
    setStaged((a) => ({ ...a, [open.key]: [] }));
    toast.success(t('sent'));
  }

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} />

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={t('emptyTitle')}
          body={t('emptyBody')}
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/kunden">{t('openCustomer')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="gap-app grid lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Toolbar
              search={{
                value: query,
                onChange: setQuery,
                label: t('search'),
                clearLabel: appT('clearSearch'),
              }}
              count={appT('results', { shown: filtered.length, total: threads.length })}
              filters={
                <>
                  <label className="min-w-36">
                    <span className="sr-only">{t('filterRead')}</span>
                    <Select
                      dense
                      value={read}
                      onChange={(e) => setRead(e.target.value as ReadFilter)}
                    >
                      <option value="all">
                        {t('filterRead')}: {t('filterAll')}
                      </option>
                      <option value="unread">{t('filterUnread')}</option>
                      <option value="read">{t('filterRead')}</option>
                    </Select>
                  </label>

                  <label className="flex items-center gap-1.5 text-sm">
                    <span className="text-ink-tertiary">{t('filterFrom')}</span>
                    <Input
                      dense
                      type="date"
                      value={from}
                      max={to || undefined}
                      className="w-auto"
                      onChange={(e) => setFrom(e.target.value)}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <span className="text-ink-tertiary">{t('filterTo')}</span>
                    <Input
                      dense
                      type="date"
                      value={to}
                      min={from || undefined}
                      className="w-auto"
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </label>

                  {filtering && (
                    <Button size="sm" variant="ghost" onClick={reset}>
                      <X className="size-3.5" aria-hidden />
                      {t('filterReset')}
                    </Button>
                  )}
                </>
              }
            />

            {filtered.length === 0 ? (
              /* The search-specific wording was the only empty state here, and
                 it named a query that may well be blank now that a date range
                 and a read filter can empty the list on their own. */
              <EmptyState
                compact
                icon={Search}
                title={t('filterEmptyTitle')}
                body={t('filterEmptyBody')}
                action={
                  <Button variant="secondary" onClick={reset}>
                    {t('filterReset')}
                  </Button>
                }
              />
            ) : (
              <Card pad="none">
                <ul>
                  {filtered.map((thread) => {
                    const last = thread.items.at(-1);
                    const active = open?.key === thread.key;
                    return (
                      <li
                        key={thread.key}
                        className="border-b border-line-subtle last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            selectThread(thread.key, thread.customerId, thread.subject)
                          }
                          aria-current={active ? 'true' : undefined}
                          className={cn(
                            'w-full px-card py-row text-left transition-colors',
                            active ? 'bg-accent-subtle' : 'hover:bg-sunken',
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                'min-w-0 truncate',
                                isUnread(thread.items) ? 'font-semibold' : 'font-medium',
                              )}
                            >
                              {nameOf(thread.customerId)}
                            </span>
                            <span className="flex shrink-0 items-center gap-1">
                              {isUnread(thread.items) && (
                                <Chip tone="info">{t('unread')}</Chip>
                              )}
                              {isWaiting(thread.items) && (
                                <Chip tone="warning">{t('waiting')}</Chip>
                              )}
                            </span>
                          </span>
                          <span
                            data-numeric
                            className="mt-0.5 block text-sm text-ink-tertiary"
                          >
                            {thread.subject}
                          </span>
                          {last && (
                            <span className="mt-1 block truncate text-sm text-ink-secondary">
                              {last.body || t('attachmentOnly')}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </div>

          <div className="lg:col-span-8">
            {!open ? (
              <EmptyState title={t('pickTitle')} body={t('pickBody')} />
            ) : (
              <Card pad="none">
                <CardHeader
                  className="p-card"
                  divided
                  title={nameOf(open.customerId)}
                  description={open.subject}
                  actions={
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/kunden/${open.customerId}`}>
                        {t('openCustomer')}
                      </Link>
                    </Button>
                  }
                />

                <ul className="space-y-3 p-card">
                  {open.items.map((message) => {
                    const ours = message.from === 'homivaro';
                    return (
                      <li
                        key={message.id}
                        className={cn(
                          'max-w-[46ch] rounded-[var(--radius-md)] border p-3',
                          ours
                            ? 'ms-auto border-transparent bg-accent-quiet'
                            : 'border-line-subtle bg-sunken',
                        )}
                      >
                        <p className="text-2xs text-ink-tertiary">
                          {ours ? t('fromUs') : t('fromCustomer')} ·{' '}
                          <span data-numeric>
                            {t('lastMessage', {
                              time: elapsed(message.at, now, locale),
                            })}
                          </span>
                        </p>
                        {message.body && (
                          <p className="mt-1 whitespace-pre-line">{message.body}</p>
                        )}
                        <MessageAttachments attachments={message.attachments} />
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-line-subtle p-card">
                  <Field label={t('replyLabel')}>
                    {(props) => (
                      <Textarea
                        {...props}
                        rows={3}
                        className="min-h-24"
                        placeholder={t('replyPlaceholder')}
                        value={drafts[open.key] ?? ''}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [open.key]: e.target.value }))
                        }
                      />
                    )}
                  </Field>

                  <AttachmentPicker
                    className="mt-3"
                    value={attachmentsFor(open.key)}
                    onChange={(next) =>
                      setStaged((a) => ({ ...a, [open.key]: next }))
                    }
                  />

                  {/* A file with nothing typed is a real message — "here is the
                      quote you asked for" — so the button follows either half.
                      Requiring text would have made the picker unusable on its
                      own without saying so. */}
                  <Button className="mt-4" onClick={reply} disabled={!canSend(open.key)}>
                    <Send className="size-4" aria-hidden />
                    {t('send')}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Nobody in the office has opened this thread.
 *
 * Only the customer's messages count. Ours are read by definition — we wrote
 * them — and counting them would mark every thread the owner replied to as
 * unread the moment the reply landed.
 */
function isUnread(items: { from: string; readByAdmin: boolean }[]) {
  return items.some((m) => m.from === 'customer' && !m.readByAdmin);
}

/** The customer wrote last, so a reply is owed — read or not. */
function isWaiting(items: { from: string }[]) {
  return items.at(-1)?.from === 'customer';
}
