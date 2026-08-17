'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Info, Send } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { useFormatter } from '@/i18n/format';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Textarea } from '@/components/ui/field';
import { SkeletonPage } from '@/components/ui/skeleton';
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
    <div className="max-w-3xl">
      <h1 className="display-type text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-[var(--measure)] text-ink-secondary">{t('lead')}</p>

      {subjects.length === 0 ? (
        <EmptyState
          className="mt-8"
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
                    value={drafts[subject] ?? ''}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [subject]: e.target.value }))
                    }
                    placeholder={t('replyPlaceholder')}
                    {...props}
                  />
                )}
              </Field>
              <Button
                className="mt-3"
                disabled={!(drafts[subject] ?? '').trim()}
                onClick={() => send(subject)}
              >
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
