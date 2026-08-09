'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Info, Send } from 'lucide-react';

import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
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
 */
export default function AccountMessagesPage() {
  const t = useTranslations('account.messages');
  const format = useFormatter();
  const hydrated = useHydrated();
  const now = useNow();

  const { messages, customerId } = useAccount();
  const patchData = useStore((s) => s.patchData);
  const allMessages = useStore((s) => s.data.messages);
  const [reply, setReply] = useState('');

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

  if (!hydrated) return <p className="text-ink-tertiary">…</p>;

  const subjects = [...new Set(messages.map((m) => m.subject))];

  function send(subject: string) {
    if (!reply.trim()) return;
    patchData({
      messages: [
        ...allMessages,
        {
          id: `msg_${allMessages.length + 1}`,
          customerId,
          subject,
          from: 'customer' as const,
          body: reply.trim(),
          at: now.toISOString(),
          readByCustomer: true,
        },
      ],
    });
    setReply('');
  }

  return (
    <div className="max-w-3xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      {subjects.length === 0 ? (
        <EmptyState className="mt-8" title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
        subjects.map((subject) => {
          const thread = messages
            .filter((m) => m.subject === subject)
            .sort((a, b) => (a.at < b.at ? -1 : 1));
          return (
            <section key={subject} className="mt-10">
              <h2 data-numeric className="label-type text-ink-tertiary">
                {t('subject', { reference: subject })}
              </h2>
              <ul className="mt-4 space-y-4">
                {thread.map((message) => (
                  <li
                    key={message.id}
                    className={cn(
                      'max-w-[85%] p-5',
                      message.from === 'customer'
                        ? 'ms-auto surface-card'
                        : 'border-l-2 border-rule bg-sunken',
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
                    <p className="mt-2 text-ink-secondary">{message.body}</p>
                  </li>
                ))}
              </ul>

              <Field label={t('replyLabel')} className="mt-5">
                {(props) => (
                  <Textarea
                    rows={3}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={t('replyPlaceholder')}
                    {...props}
                  />
                )}
              </Field>
              <Button className="mt-3" disabled={!reply.trim()} onClick={() => send(subject)}>
                <Send className="size-4" aria-hidden />
                {t('send')}
              </Button>
            </section>
          );
        })
      )}

      <div className="mt-10 flex gap-3 border-t border-line-subtle pt-6">
        <Info className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
        <div>
          <h2 className="font-medium">{t('noteTitle')}</h2>
          <p className="mt-1 max-w-[var(--measure)] text-sm text-ink-secondary">
            {t('noteBody')}
          </p>
        </div>
      </div>
    </div>
  );
}
