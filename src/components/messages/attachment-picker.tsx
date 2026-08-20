'use client';

import { useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FileText, Loader2, Paperclip, X } from 'lucide-react';

import type { Locale } from '@/i18n/routing';
import type { MessageAttachment } from '@/mock/schema';
import { Button } from '@/components/ui/button';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';
import { cn } from '@/lib/cn';
import { fileSize } from './message-attachments';

const MAX_MB = 10;
/* Images because the customer asks "which window?", PDF because everything
   this business sends a customer on paper — a quote, an invoice, a price
   list — is already a PDF elsewhere in the product. */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * Files staged against a reply, before it is sent.
 *
 * The upload is mocked and the picker says so out loud, the same way screen 20
 * does. Nothing leaves the browser; what the store keeps is the name, the kind
 * and the size the file actually had. That is enough for every screen that
 * reads an attachment back, and stopping there is what keeps the prototype
 * from claiming a file store it does not have.
 *
 * Staged, not sent-on-pick: an attachment belongs to the message it arrives
 * with, so it waits in the composer until the reply goes. Picking a file and
 * having it appear in the thread on its own would send an empty message.
 */
export function AttachmentPicker({
  value,
  onChange,
  className,
}: {
  value: MessageAttachment[];
  onChange: (next: MessageAttachment[]) => void;
  className?: string;
}) {
  const t = useTranslations('app.attachments');
  const locale = useLocale() as Locale;
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    const picked = Array.from(files);
    /* Checked before anything is staged: half a selection accepted and half
       rejected leaves the owner guessing which half went. */
    for (const file of picked) {
      if (!ACCEPTED.includes(file.type)) return fail(t('errorType'));
      if (file.size > MAX_MB * 1024 * 1024)
        return fail(t('errorSize', { max: MAX_MB, name: file.name }));
    }

    setUploading(true);
    window.setTimeout(() => {
      onChange([
        ...value,
        ...picked.map((file, i) => ({
          id: `att_${Date.now().toString(36)}_${value.length + i}`,
          name: file.name,
          kind: (file.type.startsWith('image/') ? 'image' : 'document') as
            | 'image'
            | 'document',
          size: file.size,
        })),
      ]);
      setUploading(false);
      clearInput();
    }, 500);
  }

  function fail(message: string) {
    setError(message);
    clearInput();
  }

  /* Without this, picking the same file twice in a row is silent: the input
     holds the old value, so no change event fires the second time. */
  function clearInput() {
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className={className}>
      <label
        className={cn(
          'inline-flex h-9 cursor-pointer items-center gap-2 rounded-[var(--radius-action)] border border-line-strong px-3 text-sm font-medium transition-colors hover:bg-sunken',
          uploading && 'pointer-events-none text-ink-tertiary',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="sr-only"
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Paperclip className="size-4" aria-hidden />
        )}
        {uploading ? t('uploading') : t('attach')}
      </label>

      <span className="ms-3 text-2xs text-ink-tertiary">{t('mockNotice')}</span>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-status-danger-fg">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul aria-label={t('staged', { count: value.length })} className="mt-3 space-y-2">
          {value.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line-subtle p-2"
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
              <Button
                size="sm"
                variant="ghost"
                aria-label={t('remove', { name: file.name })}
                onClick={() => onChange(value.filter((f) => f.id !== file.id))}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
