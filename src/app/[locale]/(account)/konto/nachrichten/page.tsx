'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Info, Send } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonPage } from '@/components/ui/skeleton';
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
 * "Not a live chat" is stated with the answer time next to it. §22 rules out
 * live chat; saying so — and giving the phone number for anything urgent —
 * costs less goodwill than silence does.
 *
 * A thread is a card, which is also what fixes the bubbles. They used to be
 * `surface-card` against the page ground — a white block on grey — so on a
 * card they would have been white on white. Ours is the sunken well, yours is
 * the quiet accent tint, and the two sides are told apart by colour rather
 * than by which edge they happen to hang off.
 */
export default function AccountMessagesPage() {
  const t = useTranslations('account.messages');
  const format = useFormatter();
  const hydrated = useHydrated();
  const now = useNow();

  const { messages, customerId } = useAccount();
  const patchData = useStore((s) => s.patchData);
  const allMessages = useStore((s) => s.data.messages);
  const sendMessage = useStore((s) => s.sendMessage);
  /*
   * Keyed by thread. This was a single `reply` string shared by every thread
   * on the screen: with two conversations open, typing into one wrote the same
   * characters into the other in real time, and sending cleared both.
   */
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Opening the screen is what marks them read — the badge in the sidebar
  // reads the same flag, so it clears here rather than needing its own action.
  useEffect(() => {
    const unread = allMessages.filter(
      (m) => m.customerId === customerId && m.from === 'homivaro' && !m.readByCustomer,
    );
    if (unread.length === 0) return;
    patchData({
      messages: allMessages.map((m) =>
        unread.some((u) => u.id === m.id) ? { ...m, readByCustomer: true } : m,
      ),
    });
  }, [allMessages, customerId, patchData]);

  if (!hydrated) return <SkeletonPage label={t('title')} />;

  const subjects = [...new Set(messages.map((m) => m.subject))];

  function send(subject: string) {
    const body = (drafts[subject] ?? '').trim();
    if (!body) return;
    sendMessage({ customerId, subject, body, from: 'customer' }, now);
    setDrafts((d) => ({ ...d, [subject]: '' }));
    /* Was silent. Sending a message with no acknowledgement is the one case
       where the reader genuinely cannot tell whether it worked. */
    toast.success(t('sent'));
  }

  return (
    <div>
      <PageHeader title={t('title')} lead={t('lead')} />

      {subjects.length === 0 ? (
        <EmptyState
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
        <div className="space-y-app-section">
          {subjects.map((subject) => {
            const thread = messages
              .filter((m) => m.subject === subject)
              .sort((a, b) => (a.at < b.at ? -1 : 1));
            const draft = drafts[subject] ?? '';
            return (
              <Card key={subject}>
                <CardHeader
                  title={
                    <span data-numeric>{t('subject', { reference: subject })}</span>
                  }
                />
                <CardBody>
                  <ul className="space-y-4">
                    {thread.map((message) => (
                      <li
                        key={message.id}
                        className={cn(
                          'max-w-[85%] rounded-[var(--radius-lg)] p-5',
                          message.from === 'customer'
                            ? 'ms-auto bg-accent-quiet'
                            : 'bg-sunken',
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
                </CardBody>
                <CardFooter className="block">
                  <Field label={t('replyLabel')}>
                    {(props) => (
                      <Textarea
                        {...props}
                        rows={3}
                        value={draft}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [subject]: e.target.value }))
                        }
                        placeholder={t('replyPlaceholder')}
                      />
                    )}
                  </Field>
                  <Button
                    className="mt-3"
                    disabled={!draft.trim()}
                    onClick={() => send(subject)}
                  >
                    <Send className="size-4" aria-hidden />
                    {t('send')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Alert tone="neutral" icon={Info} className="mt-app-section" title={t('noteTitle')}>
        {t('noteBody')}
      </Alert>
    </div>
  );
}
