"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useState } from "react";
import { DisplayLines } from "@/components/landing/DisplayLines";
import { Reveal } from "@/components/landing/Reveal";
import { ArrowRight, Chat, Mail, Phone } from "@/components/landing/icons";
import { EASE, inViewLoose, stagger } from "@/components/landing/motion";
import { contact } from "@/content/landing";
import { useContent, useLocale } from "@/components/landing/use-landing-content";
import { Link } from "@/i18n/navigation";
import { SEED_SERVICES } from "@/mock/seed";

/* The footer's service list is seven labels in the design and seven real
   service pages here, in the order the seed defines them. */
const SERVICE_SLUGS = SEED_SERVICES.filter((s) => s.active)
  .sort((a, b) => a.order - b.order)
  .map((s) => s.slug);

const COMPANY_ROUTES = ["/ueber-uns", "/referenzen", "/preise", "/abos", "/jobs", "/kontakt"];
const LEGAL_ROUTES = ["/rechtliches/datenschutz", "/rechtliches/agb", "/rechtliches/impressum"];

/**
 * The design draws five social icons, all of them `href="#"` — it was a
 * one-page comp with nowhere to point. The business has no accounts on any of
 * these yet, and five dead links in a footer is a worse first impression than
 * no row: they look live, they get clicked, and they go nowhere.
 *
 * So the row renders whatever has a real destination and disappears when
 * nothing does — which is today. Adding a profile is adding an `href` here,
 * and the design comes back exactly as drawn.
 *
 * WhatsApp is the exception: the number is real, it is the channel this
 * business actually answers on, and it is already in `contact`.
 */
const socials: { Icon: typeof Chat; label: string; href: string }[] = [
  { Icon: Chat, label: "WhatsApp", href: `https://wa.me/${contact.mobile.replace(/\D/g, "")}` },
  // Facebook, LinkedIn, Twitter, Instagram and YouTube are drawn in the design
  // and have no account behind them. They come back the moment one exists —
  // the icons are all still in ./icons.
].filter((s) => s.href.length > 0);

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

            <h2 className="display-type mt-14 text-[clamp(36px,4vw,52px)] leading-[0.95] text-ink-inverse">
              <DisplayLines key={locale} each={0.08}>
                {t.footer.tagline.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </DisplayLines>
            </h2>
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
              <h3 className="text-[17px] font-medium">{t.footer.supportTitle}</h3>
              <ul className="mt-5 space-y-3.5 text-[15px] text-ink-inverse/65">
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
                <li className="pl-6">{t.footer.hours}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-page/12 pt-9 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-16">
          {socials.length > 0 ? (
          <div>
            <p className="text-[15px]">{t.footer.social}</p>
            <motion.ul
              initial="hidden"
              whileInView="show"
              viewport={inViewLoose}
              variants={stagger(0.07)}
              className="mt-3 flex gap-2.5"
            >
              {socials.map(({ Icon, label, href }) => (
                <motion.li
                  key={label}
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
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink hover:bg-accent grid h-10 w-10 place-items-center rounded-full bg-page transition-[background-color,color,transform] duration-300 hover:-translate-y-1 hover:text-ink-inverse"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </div>
          ) : null}

          <div className="grid gap-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <p className="text-[15px] text-ink-inverse/70">{t.footer.copyright}</p>
              <ul className="mt-2 flex flex-wrap gap-5 text-[15px] text-ink-inverse/70">
                {t.footer.legal.map((item, i) => (
                  <li key={item}>
                    <Link
                      href={LEGAL_ROUTES[i] ?? '/'}
                      className="relative transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-page after:transition-transform after:duration-400 hover:text-ink-inverse hover:after:origin-left hover:after:scale-x-100"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <Newsletter />
          </div>
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
      <h3 className="text-[17px] font-medium">{title}</h3>
      <ul className="mt-5 space-y-3.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group inline-flex items-center text-[15px] text-ink-inverse/65 transition-colors hover:text-ink-inverse"
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

function Newsletter() {
  const t = useContent();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Reveal delay={0.1}>
      <p className="text-[17px]">{t.footer.newsletter}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email) return;
          setSent(true);
          setEmail("");
        }}
        className="mt-3 flex flex-col gap-2 rounded-3xl bg-page p-2 focus-within:ring-2 focus-within:ring-page/40 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5 sm:pl-4"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:px-0">
          <Mail className="text-ink-secondary h-4 w-4 shrink-0" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
            }}
            placeholder={t.footer.emailPlaceholder}
            aria-label={t.footer.emailPlaceholder}
            className="text-ink placeholder:text-ink-secondary min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none"
          />
        </span>
        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          className="bg-inverse hover:bg-accent inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium whitespace-nowrap text-ink-inverse transition-colors duration-300"
        >
          {sent ? t.footer.subscribed : t.actions.startPlan}
          {!sent ? <ArrowRight className="h-4 w-4" /> : null}
        </motion.button>
      </form>
    </Reveal>
  );
}
