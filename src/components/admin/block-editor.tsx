'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bold,
  ChevronDown,
  ChevronUp,
  Italic,
  Link2,
  Plus,
  Trash2,
} from 'lucide-react';

import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import { BLOG_BLOCK_KINDS, BLOG_IMAGES, applyMark, emptyBlock, listFor } from '@/lib/blog';
import type { BlogBlock, BlogBlockKind } from '@/mock/schema';

/**
 * The block editor — screen R4's body.
 *
 * Blocks rather than one rich-text surface, and the reason is translation. A
 * WYSIWYG stores an HTML blob per language; the moment it does, "is the
 * English written?" stops being answerable except by reading both, and the
 * gap count the list column depends on has nothing to count. A block keeps its
 * own text per language, so German and English can differ in how many words a
 * point takes and cannot differ in how the article is built.
 *
 * The formatting is real but deliberately small: bold, italic, and a link into
 * this site. They are inserted by the toolbar — the writer never types a mark
 * — which is the difference between a storage format that happens to be
 * legible and a syntax somebody is asked to learn.
 */

/** The marks toolbar, bound to the textarea it sits above. */
function MarkBar({
  target,
  value,
  onChange,
}: {
  target: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
}) {
  const t = useTranslations('admin.blog');

  const wrap = (mark: 'bold' | 'italic' | 'link') => {
    const el = target.current;
    if (!el) return;
    const { value: next, caret } = applyMark(value, el.selectionStart, el.selectionEnd, mark);
    onChange(next);
    /* The caret goes back where the writer was looking. Without this it lands
       at the end of the field on every button press, which makes formatting a
       second sentence in a paragraph an exercise in re-finding your place. */
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="flex gap-1">
      {(
        [
          ['bold', Bold, t('markBold')],
          ['italic', Italic, t('markItalic')],
          ['link', Link2, t('markLink')],
        ] as const
      ).map(([mark, Icon, label]) => (
        <Button
          key={mark}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          title={label}
          onClick={() => wrap(mark)}
        >
          <Icon className="size-4" aria-hidden />
        </Button>
      ))}
    </div>
  );
}

function BlockCard({
  block,
  index,
  total,
  locale,
  onPatch,
  onMove,
  onRemove,
}: {
  block: BlogBlock;
  index: number;
  total: number;
  locale: Locale;
  onPatch: (patch: Partial<BlogBlock>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const t = useTranslations('admin.blog');
  const area = useRef<HTMLTextAreaElement>(null);

  const text = block.text?.[locale] ?? '';
  const setText = (next: string) => onPatch({ text: { ...block.text, [locale]: next } });

  const kindLabel = t(`kind.${block.kind}` as 'kind.paragraph');

  return (
    <Card>
      <CardHeader
        title={kindLabel}
        actions={
          <span className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('moveUp')}
              disabled={index === 0}
              onClick={() => onMove(index - 1)}
            >
              <ChevronUp className="size-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('moveDown')}
              disabled={index === total - 1}
              onClick={() => onMove(index + 1)}
            >
              <ChevronDown className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={t('removeBlock')} onClick={onRemove}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </span>
        }
      />
      <CardBody className="space-y-4">
        {(block.kind === 'paragraph' || block.kind === 'quote') && (
          <Field label={t('fieldText')} hint={t('marksHint')}>
            {(props) => (
              <>
                <MarkBar target={area} value={text} onChange={setText} />
                <Textarea
                  {...props}
                  ref={area}
                  rows={block.kind === 'quote' ? 3 : 6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </>
            )}
          </Field>
        )}

        {block.kind === 'heading' && (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label={t('fieldHeading')}>
              {(props) => (
                <Input {...props} value={text} onChange={(e) => setText(e.target.value)} />
              )}
            </Field>
            {/* h2 or h3. Never h1 — the title already is one, and a second
                leaves the page with no outline for anybody navigating by
                heading. */}
            <Field label={t('fieldLevel')}>
              {(props) => (
                <Select
                  {...props}
                  value={String(block.level ?? 2)}
                  onChange={(e) => onPatch({ level: Number(e.target.value) as 2 | 3 })}
                >
                  <option value="2">{t('levelSection')}</option>
                  <option value="3">{t('levelSub')}</option>
                </Select>
              )}
            </Field>
          </div>
        )}

        {(block.kind === 'list' || block.kind === 'numbered') && (
          /* One line per bullet. The record holds an array, so the split
             happens here rather than in the renderer — a list kept as one
             string with newlines is how a bullet silently becomes a line
             break on the published page. */
          <Field label={t('fieldItems')} hint={t('fieldItemsHint')}>
            {(props) => (
              <Textarea
                {...props}
                rows={5}
                value={listFor(block.items, locale).join('\n')}
                onChange={(e) =>
                  onPatch({
                    items: {
                      ...block.items,
                      [locale]: e.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean),
                    },
                  })
                }
              />
            )}
          </Field>
        )}

        {block.kind === 'quote' && (
          <Field label={t('fieldAttribution')} hint={t('fieldAttributionHint')}>
            {(props) => (
              <Input
                {...props}
                value={block.attribution?.[locale] ?? ''}
                onChange={(e) =>
                  onPatch({ attribution: { ...block.attribution, [locale]: e.target.value } })
                }
              />
            )}
          </Field>
        )}

        {block.kind === 'image' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('fieldImage')} hint={t('fieldImageHint')}>
              {(props) => (
                <Select
                  {...props}
                  value={block.image ?? ''}
                  onChange={(e) => onPatch({ image: e.target.value || undefined })}
                >
                  <option value="">{t('imageNone')}</option>
                  {BLOG_IMAGES.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {block.image && (
              <Field label={t('fieldImageAlt')} hint={t('fieldAltHint')}>
                {(props) => (
                  <Input
                    {...props}
                    value={block.imageAlt?.[locale] ?? ''}
                    onChange={(e) =>
                      onPatch({ imageAlt: { ...block.imageAlt, [locale]: e.target.value } })
                    }
                  />
                )}
              </Field>
            )}
          </div>
        )}

        {block.kind === 'cta' && (
          <>
            <Field label={t('fieldCtaText')} hint={t('fieldCtaTextHint')}>
              {(props) => (
                <Textarea
                  {...props}
                  ref={area}
                  rows={2}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('fieldCtaLabel')}>
                {(props) => (
                  <Input
                    {...props}
                    value={block.label?.[locale] ?? ''}
                    onChange={(e) =>
                      onPatch({ label: { ...block.label, [locale]: e.target.value } })
                    }
                  />
                )}
              </Field>
              <Field label={t('fieldCtaHref')} hint={t('fieldCtaHrefHint')}>
                {(props) => (
                  <Input
                    {...props}
                    value={block.href ?? ''}
                    onChange={(e) => onPatch({ href: e.target.value })}
                  />
                )}
              </Field>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

export function BlockEditor({
  blocks,
  locale,
  onChange,
}: {
  blocks: BlogBlock[];
  locale: Locale;
  onChange: (next: BlogBlock[]) => void;
}) {
  const t = useTranslations('admin.blog');

  const patch = (id: string, next: Partial<BlogBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...next } : b)));

  const move = (from: number, to: number) => {
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    onChange(next);
  };

  const add = (kind: BlogBlockKind) => onChange([...blocks, emptyBlock(kind)]);

  return (
    <div>
      {blocks.length === 0 ? (
        <p className="max-w-[var(--measure)] text-ink-secondary">{t('blocksEmpty')}</p>
      ) : (
        <ul className="space-y-4">
          {blocks.map((block, index) => (
            <li key={block.id}>
              <BlockCard
                block={block}
                index={index}
                total={blocks.length}
                locale={locale}
                onPatch={(next) => patch(block.id, next)}
                onMove={(to) => move(index, to)}
                onRemove={() => onChange(blocks.filter((b) => b.id !== block.id))}
              />
            </li>
          ))}
        </ul>
      )}

      {/*
        Every kind on screen, not behind a menu.
        There are seven; a dropdown would hide the two nobody thinks to look
        for — the pull-quote and the call to action — and those are the two
        that make an article stop reading like a wall.
      */}
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-line p-3">
        <span className="label-type me-1 text-ink-tertiary">{t('addBlock')}</span>
        {BLOG_BLOCK_KINDS.map((kind) => (
          <Button
            key={kind}
            variant="secondary"
            size="sm"
            onClick={() => add(kind)}
            className={cn(kind === 'cta' && 'ms-auto')}
          >
            <Plus className="size-3.5" aria-hidden />
            {t(`kind.${kind}` as 'kind.paragraph')}
          </Button>
        ))}
      </div>
    </div>
  );
}
