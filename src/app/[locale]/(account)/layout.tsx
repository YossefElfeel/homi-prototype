import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';

/**
 * The account area keeps the public header and footer.
 *
 * A customer arriving from a booking email is still on the same site; stripping
 * the navigation would turn the account into a dead end and cost the one thing
 * this business wants from a returning customer — a second booking.
 *
 * The floating call/request actions are dropped: someone who is signed in has
 * better entry points a click away.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
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
