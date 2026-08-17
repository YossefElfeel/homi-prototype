import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';

/**
 * Sign in, activation and password reset keep the public header and footer.
 *
 * Everyone on these three screens is, by definition, not signed in yet — they
 * are still visiting the site, and stripping the navigation would strand
 * anyone who arrived at the wrong screen.
 *
 * The account area behind them does the opposite: /konto renders in the app
 * shell with no site chrome at all. That split is the point. It used to share
 * this layout, which is why every account screen read as a page on a website
 * rather than a dashboard — and the way back to the site is now an explicit
 * link in the shell instead of an ambient header.
 *
 * The floating call/request actions are dropped: someone this close to signing
 * in has better entry points a click away.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-7xl px-gutter">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
