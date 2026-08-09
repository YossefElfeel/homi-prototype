import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { FloatingActions } from '@/components/site/floating-actions';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
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
