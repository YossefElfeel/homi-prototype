"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { SVGProps } from "react";
import { DisplayLines } from "@/components/landing/DisplayLines";
import {
  Chat,
  Clock,
  Facebook,
  Instagram,
  LinkedIn,
  Mail,
  Phone,
  SwissFlag,
  YouTube,
} from "@/components/landing/icons";
import { EASE, inViewLoose, stagger } from "@/components/landing/motion";
import { contact, socialAccounts, type SocialKey } from "@/content/landing";
import { useContent, useLocale } from "@/components/landing/use-landing-content";
import { Link } from "@/i18n/navigation";
import { SEED_SERVICES } from "@/mock/seed";
import { isOffered } from '@/lib/service-catalogue';

/* The footer's service list is seven labels in the design and seven real
   service pages here, in the order the seed defines them. */
const SERVICE_SLUGS = SEED_SERVICES.filter(isOffered)
  .sort((a, b) => a.order - b.order)
  .map((s) => s.slug);

/* Index-matched against `t.footer.company`. `/gebiete` sits here because the
   eight region pages and their index had no way in from this footer at all —
   only the classic footer carried the area row, so on the shipping theme the
   entire local-SEO surface was reachable by typing a URL. */
const COMPANY_ROUTES = [
  "/ueber-uns",
  "/referenzen",
  "/preise",
  "/abos",
  "/gebiete",
  "/jobs",
  "/kontakt",
];
const LEGAL_ROUTES = ["/rechtliches/datenschutz", "/rechtliches/agb", "/rechtliches/impressum"];

/**
 * Each account's own mark, not a generic glyph.
 *
 * The row used to render WhatsApp behind the speech-bubble icon the support
 * column also uses, so the one social link on the page did not look like a
 * social link at all. A brand mark is the whole reason this row reads as a row
 * — nobody parses the labels, they recognise the shapes.
 */
const SOCIAL_ICONS: Record<SocialKey, (props: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  whatsapp: Chat,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: LinkedIn,
  youtube: YouTube,
};

/* Only the accounts that exist. See `socialAccounts` for why an empty `href`
   is skipped rather than pointed at `#`. */
const socials = socialAccounts.filter((account) => account.href.length > 0);

export function Footer() {
  const t = useContent();
  const { locale } = useLocale();

  return (
    <footer className="bg-inverse relative overflow-hidden text-ink-inverse">
      <div className="hv-container py-16 lg:py-[70px]">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-16">
          <div>
            <span className="inline-grid h-11 place-items-center rounded-full bg-page px-4">
              <Image
                src="/img/logo.png"
                alt="Homivaro"
                width={694}
                height={200}
                className="h-[30px] w-auto"
              />
            </span>

            <h2 className="display-type mt-14 text-display-5 leading-[0.95] text-ink-inverse">
              <DisplayLines key={locale} each={0.08}>
                {t.footer.tagline.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </DisplayLines>
            </h2>

            {/* Under the tagline, not in the bottom bar.
                Down there it sat level with the copyright and the legal links —
                the row of the page reserved for the things nobody is meant to
                read. A social account is somewhere we want people to go, so it
                belongs with the name and the claim, not with the small print. */}
            {socials.length > 0 ? <Socials label={t.footer.social} /> : null}
          </div>

          <div className="grid gap-12 sm:grid-cols-3">
            <FooterColumn
              title={t.footer.servicesTitle}
              items={t.footer.services.map((label, i) => ({
                label,
                href: `/leistungen/${SERVICE_SLUGS[i] ?? ''}`,
              }))}
            />
            <FooterColumn
              title={t.footer.companyTitle}
              items={t.footer.company.map((label, i) => ({
                label,
                href: COMPANY_ROUTES[i] ?? '/',
              }))}
            />

            <div>
              <h3 className="text-lead font-medium">{t.footer.supportTitle}</h3>
              <ul className="mt-5 space-y-3.5 text-body text-ink-inverse/65">
                <li>
                  <a
                    href={contact.phoneHref}
                    className="flex items-center gap-2.5 transition-colors hover:text-ink-inverse"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {contact.phone}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Chat className="h-3.5 w-3.5 shrink-0" />
                  {contact.mobile}
                </li>
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2.5 transition-colors hover:text-ink-inverse"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {contact.email}
                  </a>
                </li>
                {/* The only line in this column that was indented to *look*
                    aligned instead of being aligned by an icon like the three
                    above it. A phone, a chat and an envelope followed by a bare
                    indent reads as a missing icon, because it is one. */}
                <li className="flex items-center gap-2.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {t.footer.hours}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-page/12 pt-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-body text-ink-inverse/70">{t.footer.copyright}</p>
            <ul className="mt-2 flex flex-wrap gap-5 text-body text-ink-inverse/70">
              {t.footer.legal.map((item, i) => (
                <li key={item}>
                  {/* Padded to a real target, with the underline moved onto an
                      inner span so it still sits under the words rather than
                      under the padding. These three were 20px tall — the only
                      links on the site under the 24px floor, and they are on
                      every page of it. Same structure the service columns
                      above already use. */}
                  <Link
                    href={LEGAL_ROUTES[i] ?? '/'}
                    className="group inline-flex items-center py-1 transition-colors hover:text-ink-inverse"
                  >
                    <span className="relative">
                      {item}
                      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-page transition-transform duration-400 group-hover:origin-left group-hover:scale-x-100" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* The flag is the statement, so it is not `aria-hidden` with the
              words repeated beside it — the words *are* the alt text, and the
              mark reads as one thing to a screen reader instead of two. */}
          <p className="text-ink-inverse/70 flex shrink-0 items-center gap-2.5 text-body">
            <SwissFlag className="h-4 w-4 shrink-0" />
            {t.footer.madeIn}
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * The design left every footer link as `href="#"` — it was one page and had
 * nowhere to point. Here the columns are two real menus, so the labels are
 * zipped with routes at the call site. A footer of dead anchors is worse than
 * no column.
 */
function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-lead font-medium">{title}</h3>
      <ul className="mt-5 space-y-3.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group inline-flex items-center text-body text-ink-inverse/65 transition-colors hover:text-ink-inverse"
            >
              <span className="relative">
                {item.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-page transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:origin-left group-hover:scale-x-100" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The accounts we actually have, as their own marks.
 *
 * The list renders whatever `socialAccounts` gives it, so this component never
 * has to know which platforms exist — and the day one is opened, the row grows
 * without anything here changing.
 */
function Socials({ label }: { label: string }) {
  return (
    <div className="mt-10">
      <p className="text-body text-ink-inverse/70">{label}</p>
      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={inViewLoose}
        variants={stagger(0.07)}
        className="mt-3 flex flex-wrap gap-2.5"
      >
        {socials.map((account) => {
          const Icon = SOCIAL_ICONS[account.key];
          return (
            <motion.li
              key={account.key}
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.8 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.45, ease: EASE },
                },
              }}
            >
              <a
                href={account.href}
                aria-label={account.label}
                target="_blank"
                rel="noreferrer"
                className="text-ink hover:bg-accent grid h-10 w-10 place-items-center rounded-full bg-page transition-[background-color,color,transform] duration-300 hover:-translate-y-1 hover:text-ink-inverse"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
