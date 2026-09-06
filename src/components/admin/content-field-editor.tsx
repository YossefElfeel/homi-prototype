'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import type { ContentField, ContentSource } from '@/lib/content-registry';
import type { ContentHeadlinePart, ContentQA, ContentValue } from '@/mock/schema';

/**
 * One block of website copy, in one language.
 *
 * The five kinds are five editors rather than one text box with rules, and
 * that is the whole argument of `ContentKind`: a bullet list edited as a
 * paragraph with dashes in it comes back as a paragraph with dashes in it, and
 * the «was nicht dazugehört» block — the one the brief is emphatic about
 * keeping — turns into prose the first time somebody tidies it.
 *
 * Every control writes on change. That is right for text, whose worst case is
 * a typo the reader can see, and it is why the header carries a save
 * indicator rather than a button: there is no state on this screen where the
 * thing on screen is not the thing stored.
 */
export function ContentFieldEditor({
  field,
  label,
  value,
  source,
  onChange,
  onReset,
}: {
  field: ContentField;
  label: string;
  value: ContentValue;
  source: ContentSource;
  onChange: (value: ContentValue) => void;
  /** Absent when there is nothing to go back to — the shipped text is showing. */
  onReset: (() => void) | null;
}) {
  const t = useTranslations('admin.website');

  return (
    <section className="surface-card p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{label}</h3>
          {/* The dotted key, always. On an editorial block it is the second
              name for something that already has one; on an interface string
              it is the *only* name, and it is the one a developer greps for
              when the office reports «der Knopf heisst falsch». */}
          <p className="mt-1 font-mono text-xs text-ink-tertiary">{field.hint}</p>
        </div>

        <div className="flex items-center gap-2">
          <SourceBadge source={source} />
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="size-3.5" aria-hidden />
              {t('reset')}
            </Button>
          )}
        </div>
      </header>

      {source === 'fallback' && (
        <p className="mt-3 max-w-[var(--measure)] text-sm text-ink-secondary">
          {t('fallbackHint')}
        </p>
      )}

      <div className="mt-4">
        <Body field={field} value={value} onChange={onChange} />
      </div>
    </section>
  );
}

/**
 * Where the text on screen came from.
 *
 * `fallback` is the reason this exists. Every other state is visible without
 * being told — edited text differs from what shipped, empty is empty — but a
 * German sentence rendered on the English page looks like a finished English
 * page to anybody who does not read German, and looks like a bug to anybody
 * who does. It is one colour per state, drawn from the same three tones the
 * status registry uses, without inventing a fourth entity for it: these are
 * states of a *screen's knowledge*, not of a record, and putting them in the
 * registry would give /flows a status nothing can transition.
 */
function SourceBadge({ source }: { source: ContentSource }) {
  const t = useTranslations('admin.website');

  const tone =
    source === 'edited'
      ? 'border-status-info-line bg-status-info text-status-info-fg'
      : source === 'fallback' || source === 'missing'
        ? 'border-status-warning-line bg-status-warning text-status-warning-fg'
        : 'border-line text-ink-tertiary';

  const key =
    source === 'edited'
      ? 'sourceEdited'
      : source === 'fallback'
        ? 'sourceFallback'
        : source === 'missing'
          ? 'sourceMissing'
          : 'sourceDefault';

  return (
    <span className={cn('rounded-sm border px-1.5 py-0.5 text-xs', tone)}>{t(key)}</span>
  );
}

function Body({
  field,
  value,
  onChange,
}: {
  field: ContentField;
  value: ContentValue;
  onChange: (value: ContentValue) => void;
}) {
  switch (field.kind) {
    case 'line':
      return (
        <Input
          aria-label={field.hint}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'text':
      return (
        <Textarea
          aria-label={field.hint}
          rows={4}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'list':
      return (
        <ListEditor
          items={Array.isArray(value) ? (value as string[]).filter((v) => typeof v === 'string') : []}
          onChange={onChange}
          hint={field.hint}
        />
      );

    case 'qa':
      return (
        <PairEditor
          items={Array.isArray(value) ? (value as ContentQA[]).filter(isPair) : []}
          onChange={onChange}
          firstKey={field.pairKeys?.first ?? 'pairQuestion'}
          secondKey={field.pairKeys?.second ?? 'pairAnswer'}
        />
      );

    case 'headline':
      return (
        <HeadlineEditor
          parts={
            Array.isArray(value)
              ? (value as ContentHeadlinePart[]).filter(
                  (part) => part !== null && typeof part === 'object',
                )
              : []
          }
          onChange={onChange}
        />
      );
  }
}

function isPair(item: unknown): item is ContentQA {
  return item !== null && typeof item === 'object' && 'q' in item && 'a' in item;
}

/**
 * Move, remove, add — the three controls a list needs and a text box cannot
 * offer.
 *
 * Order carries meaning in every list on this screen. «Böden saugen und feucht
 * wischen» leads the included list because it is what the customer pictures
 * first, and the four selection steps on the careers page are a sequence with
 * a «zuerst» in the first one. Editing them as lines in a textarea would make
 * reordering a cut-and-paste, which is the operation that loses a line.
 */
function RowControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const t = useTranslations('admin.website');

  return (
    <div className="flex shrink-0 gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('moveUp')}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ChevronUp className="size-4" aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('moveDown')}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ChevronDown className="size-4" aria-hidden />
      </Button>
      {/* Ghost, not `danger`. A red-filled button on every row of a nine-item
          list would make the included block read as nine warnings — the
          destructive weight belongs on deleting a *record*, and a bullet is
          not one. */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('removeItem')}
        onClick={() => onRemove(index)}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return items;
  next.splice(to, 0, moved);
  return next;
}

function ListEditor({
  items,
  onChange,
  hint,
}: {
  items: string[];
  onChange: (value: ContentValue) => void;
  hint: string;
}) {
  const t = useTranslations('admin.website');

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-secondary">{t('listEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <Input
                aria-label={`${hint} ${index + 1}`}
                value={item}
                onChange={(e) =>
                  onChange(items.map((old, i) => (i === index ? e.target.value : old)))
                }
              />
              <RowControls
                index={index}
                count={items.length}
                onMove={(from, to) => onChange(move(items, from, to))}
                onRemove={(i) => onChange(items.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => onChange([...items, ''])}
      >
        <Plus className="size-4" aria-hidden />
        {t('addItem')}
      </Button>
    </div>
  );
}

/**
 * Two fields that belong to each other.
 *
 * A question with no answer is not half a FAQ entry, it is a bug on the
 * website — the accordion renders a row that opens onto nothing. So the pair
 * is the unit that is added and removed, and the two boxes are drawn inside
 * one bordered block rather than as neighbours in a grid, which is what makes
 * a list of five of them readable as five things instead of ten.
 */
function PairEditor({
  items,
  onChange,
  firstKey,
  secondKey,
}: {
  items: ContentQA[];
  onChange: (value: ContentValue) => void;
  firstKey: string;
  secondKey: string;
}) {
  const t = useTranslations('admin.website');

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-ink-secondary">{t('listEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={index}
              className="rounded-[var(--radius-sm)] border border-line-subtle p-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <label className="block">
                    <span className="label-type text-ink-secondary">{t(firstKey)}</span>
                    <Input
                      className="mt-1"
                      value={item.q}
                      onChange={(e) =>
                        onChange(
                          items.map((old, i) =>
                            i === index ? { ...old, q: e.target.value } : old,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="label-type text-ink-secondary">{t(secondKey)}</span>
                    <Textarea
                      className="mt-1"
                      rows={3}
                      value={item.a}
                      onChange={(e) =>
                        onChange(
                          items.map((old, i) =>
                            i === index ? { ...old, a: e.target.value } : old,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <RowControls
                  index={index}
                  count={items.length}
                  onMove={(from, to) => onChange(move(items, from, to))}
                  onRemove={(i) => onChange(items.filter((_, j) => j !== i))}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => onChange([...items, { q: '', a: '' }])}
      >
        <Plus className="size-4" aria-hidden />
        {t('addPair')}
      </Button>
    </div>
  );
}

/**
 * A display heading, one line at a time, split by colour.
 *
 * Both halves are typed rather than one string with a marker in it, because
 * both decisions this shape encodes are writing decisions and neither is
 * formatting — see `lib/display-headline.ts`. Where the line breaks matters at
 * 88px of Bebas caps, where the browser would hyphenate a German compound
 * across two lines of capitals; which half is red is the half that carries the
 * feeling. A rich-text control with a colour button would express neither.
 */
function HeadlineEditor({
  parts,
  onChange,
}: {
  parts: ContentHeadlinePart[];
  onChange: (value: ContentValue) => void;
}) {
  const t = useTranslations('admin.website');

  return (
    <div>
      <p className="max-w-[var(--measure)] text-sm text-ink-secondary">
        {t('headlineHint')}
      </p>

      {parts.length > 0 && (
        <ul className="mt-3 space-y-2">
          {parts.map((part, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="label-type text-ink-secondary">{t('headlineLead')}</span>
                  <Input
                    className="mt-1"
                    value={part.lead ?? ''}
                    onChange={(e) =>
                      onChange(
                        parts.map((old, i) =>
                          i === index ? { ...old, lead: e.target.value } : old,
                        ),
                      )
                    }
                  />
                </label>
                <label className="block">
                  <span className="label-type text-ink-secondary">{t('headlineAccent')}</span>
                  <Input
                    className="mt-1"
                    value={part.accent ?? ''}
                    onChange={(e) =>
                      onChange(
                        parts.map((old, i) =>
                          i === index ? { ...old, accent: e.target.value } : old,
                        ),
                      )
                    }
                  />
                </label>
              </div>
              <RowControls
                index={index}
                count={parts.length}
                onMove={(from, to) => onChange(move(parts, from, to))}
                onRemove={(i) => onChange(parts.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => onChange([...parts, { lead: '', accent: '' }])}
      >
        <Plus className="size-4" aria-hidden />
        {t('addItem')}
      </Button>
    </div>
  );
}
