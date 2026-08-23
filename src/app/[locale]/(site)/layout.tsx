import { getTranslations } from 'next-intl/server';

import { getTheme } from '@/lib/theme-server';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { FloatingActions } from '@/components/site/floating-actions';
import { MotionRoot } from '@/components/motion/motion-root';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { ScrollProgress } from '@/components/motion/scroll-progress';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { WhatsAppFab } from '@/components/landing/WhatsAppFab';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const theme = await getTheme();

  if (theme === 'homivaro') {
    const t = await getTranslations('nav');

    /*
     * The design's own chrome, structured the way it structures it: the whole
     * page is a white slab with a 32px radius and the navy body shows through
     * at its corners. Header, content and footer all sit inside the slab, so
     * the footer's navy is clipped by the same curve.
     *
     * `motion` and `lenis` are mounted here rather than in the root layout so
     * they stay off the console entirely and off the other four directions,
     * which reach their reveals through an IntersectionObserver and no runtime
     * library at all.
     */
    return (
      <MotionRoot>
        <SmoothScroll />
        <ScrollProgress />
        <div className="bg-inverse">
          <div className="hv-shell">
            {/* The design has no skip link. Every other direction here does,
                and losing it would be an accessibility regression dressed as a
                redesign — so it stays, invisible until focused. */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-[var(--radius-sm)] focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
            >
              {t('skipToContent')}
            </a>
            <Header />
            <main id="main">{children}</main>
            <Footer />
          </div>
        </div>
        <WhatsAppFab />
      </MotionRoot>
    );
  }

  return (
    <>
      <SiteHeader />
      {/* The mobile sticky CTA is fixed, so the page reserves its height —
          otherwise the last section is unreachable on a phone. */}
      <main id="main" className="pb-20 sm:pb-0">
        {children}
      </main>
      <SiteFooter />
      <FloatingActions />
    </>
  );
}
