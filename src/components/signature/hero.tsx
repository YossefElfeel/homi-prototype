import { ArrowRight, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ImagePlaceholder } from '@/components/ui/image-placeholder';

import type { Theme } from '@/lib/theme';

/**
 * SIGNATURE COMPONENT — one of six allowed to branch on the theme.
 *
 * The three directions do not differ by tokens here; they differ by layout.
 * Raster splits the grid and lets type carry the page. Zuhause leads with a
 * photograph in a soft card. Goldküste drops the whole section to deep navy
 * and sets the headline in serif. No radius or shadow variable can express
 * that, which is exactly the test for whether something belongs in this folder.
 */
export function Hero({ theme }: { theme: Theme }) {
  if (theme === 'zuhause') return <HeroZuhause />;
  if (theme === 'goldkueste') return <HeroGoldkueste />;
  return <HeroRaster />;
}

function useHeroCopy() {
  const t = useTranslations('site.home.hero');
  const r = useTranslations('site.home.reassurance');
  return {
    eyebrow: t('eyebrow'),
    title: t('title'),
    lead: t('lead'),
    primary: t('primary'),
    secondary: t('secondary'),
    imageAlt: t('imageAlt'),
    points: [
      { title: r('guaranteeTitle'), body: r('guaranteeBody') },
      { title: r('windowTitle'), body: r('windowBody') },
      { title: r('teamTitle'), body: r('teamBody') },
    ],
  };
}

/* --------------------------------------------------------------- Raster */

function HeroRaster() {
  const c = useHeroCopy();

  return (
    <section className="border-b border-line-subtle">
      <div className="mx-auto max-w-7xl px-gutter">
        <div className="grid gap-10 py-16 lg:grid-cols-12 lg:gap-14 lg:py-24">
          <div className="lg:col-span-7">
            <p className="label-type text-ink-tertiary">{c.eyebrow}</p>
            <h1 className="display-type mt-5 text-[clamp(2.5rem,6.5vw,4.75rem)]">
              {c.title}
            </h1>
            <span aria-hidden className="mt-7 block h-0.5 w-16 bg-rule" />
            <p className="mt-7 max-w-[46ch] text-lg text-ink-secondary">{c.lead}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/anfrage">
                  {c.primary}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/preise">{c.secondary}</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ImagePlaceholder
              seed="hero-raster"
              alt={c.imageAlt}
              className="aspect-4/3 h-full w-full lg:aspect-auto lg:min-h-[26rem]"
            />
          </div>
        </div>
      </div>

      <ReassuranceStrip points={c.points} />
    </section>
  );
}

/* -------------------------------------------------------------- Zuhause */

function HeroZuhause() {
  const c = useHeroCopy();

  return (
    <section>
      <div className="mx-auto max-w-7xl px-gutter py-12 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="label-type text-ink-tertiary">{c.eyebrow}</p>
            <h1 className="display-type mt-4 text-[clamp(2.25rem,5.5vw,3.75rem)]">
              {c.title}
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg text-ink-secondary">{c.lead}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/anfrage">
                  {c.primary}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="quiet">
                <Link href="/preise">{c.secondary}</Link>
              </Button>
            </div>
          </div>

          <ImagePlaceholder
            seed="hero-zuhause"
            alt={c.imageAlt}
            className="aspect-4/3 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)]"
          />
        </div>
      </div>

      <ReassuranceStrip points={c.points} />
    </section>
  );
}

/* ------------------------------------------------------------ Goldküste */

function HeroGoldkueste() {
  const c = useHeroCopy();

  return (
    <section>
      <div className="bg-inverse text-ink-inverse">
        <div className="mx-auto max-w-5xl px-gutter py-24 lg:py-36">
          <p className="label-type text-ink-inverse-secondary">{c.eyebrow}</p>
          <h1 className="display-type mt-8 max-w-[18ch] text-[clamp(2.75rem,6.5vw,5.25rem)]">
            {c.title}
          </h1>
          <span aria-hidden className="mt-10 block h-px w-full max-w-md bg-rule" />
          <p className="mt-8 max-w-[48ch] text-lg text-ink-inverse-secondary">{c.lead}</p>

          <div className="mt-11 flex flex-wrap items-center gap-5">
            <Button
              asChild
              size="lg"
              className="bg-white text-[var(--brand-navy-900)] hover:bg-white/88"
            >
              <Link href="/anfrage">
                {c.primary}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Link
              href="/preise"
              className="border-b border-white/35 pb-1 text-sm text-white/80 transition-colors hover:border-white hover:text-white"
            >
              {c.secondary}
            </Link>
          </div>
        </div>
      </div>

      <ReassuranceStrip points={c.points} />
    </section>
  );
}

/* ---------------------------------------------------------------- shared */

/**
 * Directly under the hero on all three, because it answers the first question
 * this audience actually has — not "how much" but "can I trust you in my house
 * when I am not there".
 */
function ReassuranceStrip({
  points,
}: {
  points: { title: string; body: string }[];
}) {
  return (
    <div className="border-y border-line-subtle bg-sunken">
      <ul className="mx-auto grid max-w-7xl gap-px px-gutter sm:grid-cols-3">
        {points.map((point) => (
          <li key={point.title} className="py-6 sm:pr-8">
            <p className="flex items-center gap-2 font-medium">
              <Check className="size-4 shrink-0 text-eco" aria-hidden />
              {point.title}
            </p>
            <p className="mt-1.5 pl-6 text-sm text-ink-secondary">{point.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
