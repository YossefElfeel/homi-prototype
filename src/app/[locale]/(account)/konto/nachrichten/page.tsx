'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Info, MessageSquare, Search, Send, X } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination, paginate } from '@/components/ui/pagination';
import { SkeletonPage } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toolbar } from '@/components/ui/toolbar';
import { MessageAttachments } from '@/components/messages/message-attachments';
import { useAccount } from '@/lib/use-account';
import { useHydrated, useNow, useStore } from '@/mock/store';
import { cn } from '@/lib/cn';

/**
 * Screen 48 — messages.
 *
 * Threaded by the reference the message belongs to, not by date. Everything
 * this business writes is about a specific request, quote or job, and a flat
 * inbox forces the customer to reconstruct which one.
 *
 * The threads are a rail now, not a stack. Every conversation was rendered
 * open, one under the other, each with its own transcript and its own reply
 * box — so a customer with a live quote, a booked job and an unpaid invoice
 * scrolled through three whole conversations to reach the one they came for,
 * and the reply box they eventually typed into was whichever one they had
 * stopped scrolling at. One is open at a time now, picked from a list beside
 * it, which is also what makes filtering possible: with everything open at
 * once there was nothing for a filter to narrow.
 *
 * The «Betreff A-2481» heading over each thread went with the stack. The rail
 * already names the conversation you are in, so the heading spent a line on
 * every thread restating the row the reader had just clicked — with a word in
 * front of it that says nothing the reference does not.
 *
 * "Not a live chat" is stated with the answer time next to it. §22 rules out
 * live chat; saying so — and giving the phone number for anything urgent —
 * costs less goodwill than silence does.
 */

/**
 * What a thread hangs off, read from the reference itself.
 *
 * The store has no field for this — `subject` is a bare string — but the
 * prefix is not decoration: it is assigned by whichever record opened the
 * conversation, and it is the only thing that tells a quote from an invoice
 * without joining four collections this screen has no other use for.
 *
 * `RE-` is tested first. Testing the single letters first would file every
 * invoice under `other`, since `RE-2026-0048` starts with none of `A`, `O` or
 * `B` — but a later `R-` series would collide with it, and a reference filed
 * silently under the wrong tab is worse than one extra branch.
 */
type Kind = 'request' | 'offer' | 'booking' | 'invoice' | 'other';

/** The order the customer met these records in, not alphabetical. */
const KIND_ORDER: Kind[] = ['request', 'offer', 'booking', 'invoice', 'other'];

function kindOf(reference: string): Kind {
  if (reference.startsWith('RE-')) return 'invoice';
  if (reference.startsWith('A-')) return 'request';
  if (reference.startsWith('O-')) return 'offer';
  if (reference.startsWith('B-')) return 'booking';
  return 'other';
}

export default function AccountMessagesPage() {
  const t = useTranslations('account.messages');
  const appT = useTranslations('app');
  const format = useFormatter();
  const hydrated = useHydrated();
  const now = useNow();

  const { messages, customerId } = useAccount();
  const markThreadRead = useStore((s) => s.markThreadRead);
  const sendMessage = useStore((s) => s.sendMessage);

  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  /*
   * Keyed by thread. This was a single `reply` string shared by every thread
   * on the screen: with two conversations open, typing into one wrote the same
   * characters into the other in real time, and sending cleared both.
   */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [seenCount, setSeenCount] = useState(0);

  const threads = useMemo(() => {
    const map = new Map<string, typeof messages>();
    for (const message of messages) {
      const thread = map.get(message.subject);
      if (thread) thread.push(message);
      else map.set(message.subject, [message]);
    }

    return [...map.entries()]
      .map(([subject, items]) => ({
        subject,
        kind: kindOf(subject),
        items: [...items].sort((a, b) => a.at.localeCompare(b.at)),
      }))
      .sort((a, b) => (b.items.at(-1)?.at ?? '').localeCompare(a.items.at(-1)?.at ?? ''));
  }, [messages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads
      .filter((thread) => kind === 'all' || thread.kind === kind)
      .filter(
        (thread) =>
          !q ||
          thread.subject.toLowerCase().includes(q) ||
          thread.items.some((m) => m.body.toLowerCase().includes(q)),
      );
  }, [threads, kind, query]);

  /*
   * Resolved against every thread, not just the surviving ones — the same rule
   * the office's side of this screen follows. Narrowing the list must not pull
   * the transcript out from under whoever is reading it.
   */
  const open = threads.find((thread) => thread.subject === openSubject) ?? filtered[0] ?? null;
  const openKey = open?.subject ?? null;

  /*
   * Reading a thread is what marks it read, and this used to mark *every*
   * thread the moment the screen mounted. That was defensible while all of
   * them were rendered open; with one open at a time it would clear the
   * sidebar badge for conversations the customer never looked at.
   */
  useEffect(() => {
    if (!openKey) return;
    markThreadRead(customerId, openKey, 'customer');
  }, [openKey, customerId, markThreadRead]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  /* Only the kinds this customer actually has. A strip offering «Rechnungen»
     to somebody who has never been sent one is a tab that can only ever end on
     an empty list. */
  const kinds = KIND_ORDER.filter((k) => threads.some((thread) => thread.kind === k));
  const countOf = (k: Kind) => threads.filter((thread) => thread.kind === k).length;
  const filtering = query.trim().length > 0;
  /* "3 von 12" has to count against the tab you are in — on «Offerten» the
     full total is not a denominator anything on screen adds up to. */
  const tabTotal = kind === 'all' ? threads.length : countOf(kind);

  const draft = openKey ? (drafts[openKey] ?? '') : '';

  /* The rail follows its list back to the top whenever a tab or the search
     changes its length — narrowing to four threads must not leave you looking
     at page two of them. Adjusted during render rather than in an effect: an
     effect paints the stale page first, and that flash lands on every
     keystroke. Same rule `DataView` uses on the tables. */
  if (seenCount !== filtered.length) {
    setSeenCount(filtered.length);
    setPage(1);
  }
  const view = paginate(filtered, page, 10);

  function send() {
    if (!open) return;
    const body = draft.trim();
    if (!body) return;
    sendMessage({ customerId, subject: open.subject, body, from: 'customer' }, now);
    setDrafts((d) => ({ ...d, [open.subject]: '' }));
    /* Was silent. Sending a message with no acknowledgement is the one case
       where the reader genuinely cannot tell whether it worked. */
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
          /* There is no way to start a thread here — a message hangs off a
             reference — so the escape is the screen where those references
             live, rather than a compose box that would have nothing to attach
             itself to. */
          action={
            <Button asChild variant="secondary">
              <Link href="/konto/anfragen">{t('emptyAction')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="gap-app grid lg:grid-cols-12">
          <Tabs
            value={kind}
            onValueChange={(v) => setKind(v as Kind | 'all')}
            className="lg:col-span-4"
          >
            <Toolbar
              search={{
                value: query,
                onChange: setQuery,
                label: t('search'),
                clearLabel: appT('clearSearch'),
              }}
              /* Only when there is more than one kind to tell apart. A customer
                 whose every conversation is about a quote would get a strip
                 reading «Alle | Offerten», two tabs showing one list. */
              views={
                kinds.length > 1 ? (
                  <TabsList className="p-0.5">
                    <TabsTrigger value="all" className="h-8 gap-1.5 px-2.5 py-0">
                      {t('tabAll')}
                      <span data-numeric className="text-ink-tertiary">
                        {threads.length}
                      </span>
                    </TabsTrigger>
                    {kinds.map((k) => (
                      <TabsTrigger key={k} value={k} className="h-8 gap-1.5 px-2.5 py-0">
                        {t(`kind.${k}`)}
                        <span data-numeric className="text-ink-tertiary">
                          {countOf(k)}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                ) : undefined
              }
              /* Only while searching. Unfiltered it restates a total the tab
                 beside it already carries. */
              count={
                filtering ? appT('results', { shown: filtered.length, total: tabTotal }) : null
              }
              filters={
                filtering ? (
                  <Button size="sm" variant="ghost" onClick={() => setQuery('')}>
                    <X className="size-3.5" aria-hidden />
                    {t('filterReset')}
                  </Button>
                ) : undefined
              }
            />

            {filtered.length === 0 ? (
              /* Only the search can empty this list — a tab is rendered only
                 when at least one thread is filed under it — so the copy names
                 the query rather than hedging about "filters", and clearing it
                 always lands back on something. */
              <EmptyState
                compact
                icon={Search}
                title={t('searchEmptyTitle')}
                body={t('searchEmptyBody', { query })}
                action={
                  <Button variant="secondary" onClick={() => setQuery('')}>
                    {t('filterReset')}
                  </Button>
                }
              />
            ) : (
              <Card pad="none">
                <ul>
                  {view.slice.map((thread) => {
                    const last = thread.items.at(-1);
                    const active = openKey === thread.subject;
                    const unread = thread.items.some(
                      (m) => m.from === 'homivaro' && !m.readByCustomer,
                    );
                    return (
                      <li
                        key={thread.subject}
                        className="border-b border-line-subtle last:border-0"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenSubject(thread.subject)}
                          aria-current={active ? 'true' : undefined}
                          className={cn(
                            'w-full px-card py-row text-left transition-colors',
                            active ? 'bg-accent-subtle' : 'hover:bg-sunken',
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span
                              data-numeric
                              className={cn(
                                'min-w-0 truncate',
                                unread ? 'font-semibold' : 'font-medium',
                              )}
                            >
                              {thread.subject}
                            </span>
                            {unread && <Chip tone="info">{t('unread')}</Chip>}
                          </span>
                          <span className="mt-0.5 block text-sm text-ink-tertiary">
                            {t(`kind.${thread.kind}`)}
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
                {/*
                  The rail carries one row per reference and nothing retires
                  them, so a customer of two years' standing scrolls a column
                  that only ever grows. Ten a page, the same ten every table in
                  the product pages at, and the line stays under a short rail to
                  say where the ceiling is.
                */}
                <Pagination
                  className="px-card pb-card"
                  page={view.page}
                  pageCount={view.pageCount}
                  onPageChange={setPage}
                  label={appT('pageLabel')}
                  previousLabel={appT('pagePrevious')}
                  nextLabel={appT('pageNext')}
                  summary={appT('pageSummary', {
                    from: view.from,
                    to: view.to,
                    total: view.total,
                  })}
                  note={appT('pagePerPage', { n: 10 })}
                />
              </Card>
            )}
          </Tabs>

          <div className="lg:col-span-8">
            {!open ? (
              <EmptyState title={t('pickTitle')} body={t('pickBody')} />
            ) : (
              <Card pad="none">
                <CardHeader
                  className="p-card"
                  divided
                  title={<span data-numeric>{open.subject}</span>}
                  description={t(`kind.${open.kind}`)}
                />

                <ul className="space-y-4 p-card">
                  {open.items.map((message) => (
                    <li
                      key={message.id}
                      className={cn(
                        /* Ours is the sunken well, yours is the quiet accent
                           tint. Both used to be `surface-card` against the page
                           ground — a white block on grey — so on a card they
                           would have been white on white. The two sides are
                           told apart by colour rather than by which edge they
                           happen to hang off. */
                        'max-w-[85%] rounded-[var(--radius-lg)] p-5',
                        message.from === 'customer' ? 'ms-auto bg-accent-quiet' : 'bg-sunken',
                      )}
                    >
                      <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="text-sm font-medium">
                          {message.from === 'customer' ? t('fromYou') : t('fromUs')}
                        </span>
                        <span data-numeric className="text-xs text-ink-tertiary">
                          {format.dateTime(new Date(message.at), 'short')}
                        </span>
                      </p>
                      {message.body && (
                        <p className="mt-2 text-ink-secondary">{message.body}</p>
                      )}
                      {/* Read-only here. The customer receiving a file is the
                          whole reason the office can send one; letting them send
                          one back is a separate decision with its own storage
                          and virus-scanning questions, and §22 has not answered
                          them. */}
                      <MessageAttachments attachments={message.attachments} />
                    </li>
                  ))}
                </ul>

                <div className="border-t border-line-subtle p-card">
                  <Field label={t('replyLabel')}>
                    {(props) => (
                      <Textarea
                        {...props}
                        rows={3}
                        value={draft}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [open.subject]: e.target.value }))
                        }
                        placeholder={t('replyPlaceholder')}
                      />
                    )}
                  </Field>
                  <Button className="mt-3" disabled={!draft.trim()} onClick={send}>
                    <Send className="size-4" aria-hidden />
                    {t('send')}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <Alert tone="neutral" icon={Info} className="mt-app-section" title={t('noteTitle')}>
        {t('noteBody')}
      </Alert>
    </div>
  );
}
