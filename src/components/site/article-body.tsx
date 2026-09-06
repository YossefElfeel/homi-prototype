import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { listFor, parseMarks, textFor } from '@/lib/blog';
import type { BlogBlock } from '@/mock/schema';

/**
 * An article's blocks, as the visitor reads them.
 *
 * The one place in the app that switches on `BlogBlockKind`. `BlogBlock` is a
 * flat interface with optional fields rather than a discriminated union — see
 * the note on the type for why the editor could not live with a union — so the
 * discrimination is paid for here, once, instead of at every keystroke in the
 * panel.
 *
 * A kind this does not know renders as nothing rather than crashing. A blog
 * post is not worth taking a page down for, and an author who adds a block the
 * deployed site cannot draw yet should see it missing, not see a stack trace.
 */

function Marks({ text }: { text: string }) {
  return (
    <>
      {parseMarks(text).map((mark, i) => {
        if (mark.kind === 'bold') return <strong key={i}>{mark.text}</strong>;
        if (mark.kind === 'italic') return <em key={i}>{mark.text}</em>;
        if (mark.kind === 'link') {
          return (
            <Link
              key={i}
              href={mark.href}
              className="text-ink-accent underline underline-offset-2 hover:no-underline"
            >
              {mark.text}
            </Link>
          );
        }
        return <span key={i}>{mark.text}</span>;
      })}
    </>
  );
}

export function ArticleBody({
  blocks,
  locale,
}: {
  blocks: BlogBlock[];
  locale: Locale;
}) {
  return (
    <>
      {blocks.map((block) => {
        const text = textFor(block.text, locale);

        switch (block.kind) {
          case 'paragraph':
            return text ? (
              <p key={block.id} className="mt-6 text-ink-secondary">
                <Marks text={text} />
              </p>
            ) : null;

          case 'heading': {
            /* h2 or h3, never h1 — the article's title is the h1, and a second
               one is no document outline at all. */
            const Heading = block.level === 3 ? 'h3' : 'h2';
            return text ? (
              <Heading
                key={block.id}
                className={block.level === 3 ? 'subhead-type mt-10 text-xl' : 'subhead-type mt-12 text-2xl'}
              >
                {text}
              </Heading>
            ) : null;
          }

          case 'list':
          case 'numbered': {
            const items = listFor(block.items, locale);
            if (items.length === 0) return null;
            const List = block.kind === 'numbered' ? 'ol' : 'ul';
            return (
              <List
                key={block.id}
                className={
                  block.kind === 'numbered'
                    ? 'mt-6 list-decimal space-y-2 ps-5 text-ink-secondary marker:text-ink-tertiary'
                    : 'mt-6 list-disc space-y-2 ps-5 text-ink-secondary marker:text-ink-tertiary'
                }
              >
                {items.map((item, i) => (
                  <li key={i}>
                    <Marks text={item} />
                  </li>
                ))}
              </List>
            );
          }

          case 'quote': {
            if (!text) return null;
            const who = textFor(block.attribution, locale);
            return (
              <figure key={block.id} className="mt-10 border-s-2 border-rule ps-5">
                <blockquote className="text-lead text-ink">
                  <Marks text={text} />
                </blockquote>
                {who && (
                  <figcaption className="mt-2 text-sm text-ink-tertiary">{who}</figcaption>
                )}
              </figure>
            );
          }

          case 'image':
            return block.image ? (
              <Image
                key={block.id}
                src={block.image}
                alt={textFor(block.imageAlt, locale)}
                width={1360}
                height={850}
                className="mt-10 w-full rounded-[var(--radius-lg)] object-cover"
              />
            ) : null;

          case 'cta': {
            const label = textFor(block.label, locale);
            if (!label || !block.href) return null;
            return (
              /*
               * A block rather than a fixed footer, so the writer decides where
               * the ask goes. After the checklist is where somebody has just
               * realised how much work it is — which is a better moment than
               * after the sign-off nobody reads.
               */
              <aside
                key={block.id}
                className="mt-12 rounded-[var(--radius-lg)] bg-sunken p-6 sm:p-8"
              >
                {text && (
                  <p className="max-w-[var(--measure)] text-ink">
                    <Marks text={text} />
                  </p>
                )}
                <Button asChild className={text ? 'mt-5' : undefined}>
                  <Link href={block.href}>
                    {label}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </aside>
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
