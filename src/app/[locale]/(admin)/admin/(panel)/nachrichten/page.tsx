'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MessageSquare, Search, Send } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Toolbar } from '@/components/ui/toolbar';
import { TemplatePicker } from '@/components/admin/template-picker';
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
 */
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
  const [openKey, setOpenKey] = useState<string | null>(null);
  /* Keyed by thread. One shared draft across threads is the bug the customer
     side shipped with — typing in one wrote into all of them. */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

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
    if (!q) return threads;
    return threads.filter(
      (thread) =>
        thread.subject.toLowerCase().includes(q) ||
        nameOf(thread.customerId).toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, query, customers]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const open = filtered.find((thread) => thread.key === openKey) ?? filtered[0] ?? null;

  /* "Unread" here means unanswered: the customer wrote last. The
     readByCustomer flag is the customer's side of the same conversation. */
  const isWaiting = (items: typeof messages) => items.at(-1)?.from === 'customer';

  function selectThread(key: string, customerId: string, subject: string) {
    setOpenKey(key);
    markThreadRead(customerId, subject);
  }

  function post(customerId: string, subject: string, body: string) {
    sendMessage({ customerId, subject, body, from: 'homivaro' }, now);
  }

  function reply() {
    if (!open) return;
    const body = (drafts[open.key] ?? '').trim();
    if (!body) return;

    post(open.customerId, open.subject, body);
    setDrafts((d) => ({ ...d, [open.key]: '' }));
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
            />

            {filtered.length === 0 ? (
              <EmptyState
                compact
                icon={Search}
                title={t('searchEmptyTitle')}
                body={t('searchEmptyBody', { query })}
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
                            <span className="min-w-0 truncate font-medium">
                              {nameOf(thread.customerId)}
                            </span>
                            {isWaiting(thread.items) && (
                              <Chip tone="info">{t('unread')}</Chip>
                            )}
                          </span>
                          <span
                            data-numeric
                            className="mt-0.5 block text-sm text-ink-tertiary"
                          >
                            {thread.subject}
                          </span>
                          {last && (
                            <span className="mt-1 block truncate text-sm text-ink-secondary">
                              {last.body}
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
                        <p className="mt-1 whitespace-pre-line">{message.body}</p>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-line-subtle p-card">
                  {/*
                    Eleven templates sat in settings and exactly one — the quote
                    mail — was ever read. Whoever replied here retyped, in the
                    customer's language, what screen 79 already held. The picker
                    is shared now, so this screen cannot drift from the invoice
                    and quote ones; and because the thread knows who it is with
                    and what it references, {name} and {reference} resolve, which
                    is what makes sending without editing safe rather than
                    reckless.
                  */}
                  <TemplatePicker
                    locale={
                      customers.find((c) => c.id === open.customerId)?.language ?? 'de'
                    }
                    vars={{ name: nameOf(open.customerId), reference: open.subject }}
                    hasDraft={Boolean((drafts[open.key] ?? '').trim())}
                    onInsert={(message) =>
                      setDrafts((d) => ({ ...d, [open.key]: message.body }))
                    }
                    onSend={(message) => post(open.customerId, open.subject, message.body)}
                  />

                  <Field label={t('replyLabel')} className="mt-4">
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
                  <Button
                    className="mt-3"
                    onClick={reply}
                    disabled={!(drafts[open.key] ?? '').trim()}
                  >
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
