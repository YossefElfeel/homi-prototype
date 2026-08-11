import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

/** Screen 11 in the site track — a real screen with real exits, not a dead end. */
export default function NotFound() {
  const t = useTranslations('errors');
  const nav = useTranslations('nav');

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-gutter py-section">
      <p className="label-type text-ink-tertiary">404</p>
      <h1 className="display-type rule-accent mt-4 text-4xl sm:text-5xl">
        {t('notFoundTitle')}
      </h1>
      <p className="mt-6 text-lg text-ink-secondary">{t('notFoundBody')}</p>

      {/*
        The three links used to be "Services" pointing at the homepage and two
        internal dev boards. Someone arriving from a stale email got the wrong
        page under the right label, and a tour of the prototype's scaffolding.
      */}
      <ul className="mt-8 space-y-3 border-t border-line-subtle pt-6">
        {(
          [
            ['/leistungen', nav('services')],
            ['/preise', nav('pricing')],
            ['/kontakt', nav('contact')],
          ] as const
        ).map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="text-ink-accent underline decoration-from-font underline-offset-4 hover:decoration-2"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Button asChild>
          <Link href="/anfrage">{nav('requestQuote')}</Link>
        </Button>
      </div>
    </main>
  );
}
