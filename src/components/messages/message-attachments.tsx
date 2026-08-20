'use client';

import { useLocale, useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';

import type { Locale } from '@/i18n/routing';
import type { MessageAttachment } from '@/mock/schema';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { cn } from '@/lib/cn';

/**
 * What a message carries besides its text, on both ends of the thread.
 *
 * One component rather than one per screen, because the customer has to see
 * the same file the owner attached — an attachment rendered only in the panel
 * would be a file sent to nobody. The two screens style their bubbles
 * differently and this sits inside either.
 *
 * Nothing here is a link. The files are mocked, and a row that looks
 * clickable and does nothing when clicked is a worse lie than a row that
 * never offered. The composer says the upload is mocked; this stays quiet and
 * stays honest by not promising.
 */
export function MessageAttachments({
  attachments,
  className,
}: {
  attachments: MessageAttachment[] | undefined;
  className?: string;
}) {
  const t = useTranslations('app.attachments');
  const locale = useLocale() as Locale;

  if (!attachments?.length) return null;

  return (
    <ul
      aria-label={t('label', { count: attachments.length })}
      className={cn('mt-3 space-y-2', className)}
    >
      {attachments.map((file) => (
        <li
          key={file.id}
          className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line-subtle bg-card p-2"
        >
          {file.kind === 'image' ? (
            <ImagePlaceholder
              seed={file.id}
              alt={file.name}
              className="size-10 shrink-0 rounded-[var(--radius-xs)]"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-xs)] bg-sunken text-ink-tertiary"
            >
              <FileText className="size-4" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{file.name}</span>
            <span data-numeric className="block text-2xs text-ink-tertiary">
              {fileSize(file.size, locale)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Bytes, as a person reads them.
 *
 * Rounded to one decimal above a megabyte and to none below it: the size is
 * there to answer "is this going to be slow to open", and a second decimal
 * answers nothing while making the row harder to scan.
 */
export function fileSize(bytes: number, locale: Locale) {
  const kb = bytes / 1000;
  return kb < 1000
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(kb)} KB`
    : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(kb / 1000)} MB`;
}
