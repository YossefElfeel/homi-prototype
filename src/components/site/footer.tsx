import { useTranslations } from 'next-intl';
import { Mail, MessageCircle, Phone } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/site/logo';
import { SERVED_REGIONS } from '@/mock/engines/coverage';
import { SEED_SERVICES } from '@/mock/seed';

export function SiteFooter() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const brand = useTranslations('brand');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line-subtle bg-sunken">
      <div className="mx-auto max-w-7xl px-gutter py-block">
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
                href={`https://wa.me/${brand('mobile').replace(/\D/g, '')}`}
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
