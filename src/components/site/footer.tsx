import { useTranslations } from 'next-intl';
import { Mail, MessageCircle, Phone } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/site/logo';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { SEED_SERVICES } from '@/mock/seed';
import type { Theme } from '@/lib/theme';
import { cn } from '@/lib/cn';

export function SiteFooter({ theme }: { theme?: Theme }) {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const brand = useTranslations('brand');
  const year = new Date().getFullYear();

  const hv = theme === 'homivaro';

  /* Homivaro's footer is the same navy the shell floats on, so it re-binds the
     tokens for its subtree (see .hv-footer) instead of every child swapping to
     an inverse class. The markup below is shared by all five directions. */
  return (
    <footer
      className={cn(
        hv ? 'hv-footer bg-sunken' : 'border-t border-line-subtle bg-sunken',
      )}
    >
      <div
        className={cn(
          'py-block',
          hv ? 'hv-container' : 'mx-auto max-w-7xl px-gutter',
        )}
      >
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-ink-secondary">{brand('tagline')}</p>

            {/* Careers sits in the footer, never in the main nav — the main nav
                belongs to customers, and diluting it costs conversion. */}
            <Link
              href="/jobs"
              className="mt-6 inline-flex items-center gap-2 border-b border-rule pb-0.5 text-sm font-medium text-ink transition-colors hover:text-ink-accent"
            >
              {t('careersCta')}
            </Link>
          </div>

          <FooterColumn title={t('servicesHeading')}>
            {SEED_SERVICES.filter((s) => s.active).map((service) => (
              <FooterLink key={service.slug} href={`/leistungen/${service.slug}`}>
                {service.name.de}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={t('companyHeading')}>
            <FooterLink href="/ueber-uns">{nav('about')}</FooterLink>
            <FooterLink href="/referenzen">{nav('gallery')}</FooterLink>
            <FooterLink href="/preise">{nav('pricing')}</FooterLink>
            <FooterLink href="/abos">{nav('packages')}</FooterLink>
            <FooterLink href="/jobs">{nav('careers')}</FooterLink>
            <FooterLink href="/kontakt">{nav('contact')}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t('contactHeading')}>
            <li>
              <a
                href={`tel:${brand('phone').replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 text-sm text-ink-secondary transition-colors hover:text-ink"
              >
                <Phone className="size-3.5 shrink-0" aria-hidden />
                <span data-numeric>{brand('phone')}</span>
              </a>
            </li>
            <li>
              <a
                /* `wa.me` wants the number in international form with no plus
                   and no leading zero. Stripping the non-digits out of the
                   local `076 227 79 66` gave `0762277966` and WhatsApp opened
                   on "phone number shared via link is not on WhatsApp" — the
                   link had never worked. Same fix the floating button already
                   had. */
                href={`https://wa.me/41${brand('mobile').replace(/\D/g, '').replace(/^0/, '')}`}
                className="inline-flex items-center gap-2 text-sm text-ink-secondary transition-colors hover:text-ink"
              >
                <MessageCircle className="size-3.5 shrink-0" aria-hidden />
                <span data-numeric>{brand('mobile')}</span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${brand('email')}`}
                className="inline-flex items-center gap-2 text-sm text-ink-secondary transition-colors hover:text-ink"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden />
                {brand('email')}
              </a>
            </li>
            <li className="pt-1 text-sm text-ink-tertiary">{t('hours')}</li>
          </FooterColumn>
        </div>

        <div className="mt-10 border-t border-line-subtle pt-8">
          <h2 className="label-type text-ink-tertiary">{t('areasHeading')}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {SERVED_REGIONS.map((region) => (
              <li key={region.slug}>
                <Link
                  href={`/gebiete/${region.slug}`}
                  className="text-sm text-ink-secondary transition-colors hover:text-ink"
                >
                  {region.name}
                  <span data-numeric className="ml-1.5 text-ink-tertiary">
                    {region.postcode}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-tertiary">{t('rights', { year })}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <FooterLink href="/rechtliches/agb">{t('terms')}</FooterLink>
            <FooterLink href="/rechtliches/datenschutz">{t('privacy')}</FooterLink>
            <FooterLink href="/rechtliches/impressum">{t('imprint')}</FooterLink>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="label-type text-ink-tertiary">{title}</h2>
      <ul className="mt-3 space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-ink-secondary transition-colors hover:text-ink"
      >
        {children}
      </Link>
    </li>
  );
}
