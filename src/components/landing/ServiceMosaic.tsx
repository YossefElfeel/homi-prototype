"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useLocale } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Money } from "@/components/ui/money";
import { ArrowUpRight } from "@/components/landing/icons";
import { cardRise, inViewLoose, stagger } from "@/components/landing/motion";
import { SERVICE_ICONS, serviceFromPrice } from "@/components/site/service-grid";
import { SEED_SERVICES } from "@/mock/seed";

/** The three photographs the design shipped, on the three services they show. */
const PHOTO: Partial<Record<string, string>> = {
  unterhaltsreinigung: "/img/service-1.webp",
  umzugsreinigung: "/img/service-2.webp",
  moebelmontage: "/img/service-3.webp",
};

/**
 * The seven services, as an editorial mosaic rather than a uniform grid.
 *
 * A seven-cell grid of identical cards reads as a table of contents; this is
 * the page where somebody chooses. So the three services that came with a
 * photograph take a wide cell and lead each row, and the four without take a
 * narrow one — which also means no service is ever shown under a photograph of
 * a different job, and no cell falls back to a placeholder.
 *
 * The price is set in Bebas. A price is a numeral, so it clears the rule that
 * nothing in this direction sets Bebas below 36px for reading.
 */
export function ServiceMosaic({ exclude }: { exclude?: string }) {
  const locale = useLocale() as Locale;

  const items = SEED_SERVICES.filter((s) => s.active && s.slug !== exclude).sort(
    (a, b) => a.order - b.order,
  );

  return (
    <motion.ul
      initial="hidden"
      whileInView="show"
      viewport={inViewLoose}
      variants={stagger(0.07)}
      /* items-start, so a text tile beside a photo tile keeps its own height.
         Stretching them to match left roughly 150px of void between the body
         and the price on every light card — the grid filling space the design
         never asked it to fill. Ragged bottoms are the correct reading of a
         mosaic. */
      className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {items.map((service, i) => {
        const photo = PHOTO[service.slug];
        /* Next flagged this one as the Largest Contentful Paint on
           /leistungen and it was loading lazily. Only the first tile: marking
           all three would have them compete for the same early bandwidth. */
        const isLcp = i === 0 && Boolean(photo);
        const Icon = SERVICE_ICONS[service.slug];

        return (
          <motion.li
            key={service.slug}
            variants={cardRise}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className={`hv-card group overflow-hidden ${
              photo ? "hv-card-dark sm:col-span-2 lg:col-span-2" : "hv-card-light"
            }`}
          >
            <Link
              href={`/leistungen/${service.slug}`}
              className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus"
            >
              {photo ? (
                <span className="relative block h-[220px] overflow-hidden">
                  <Image
                    src={photo}
                    alt=""
                    fill
                    priority={isLcp}
                    sizes="(max-width: 640px) 100vw, 66vw"
                    className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </span>
              ) : null}

              <span className="flex flex-1 flex-col p-7">
                {!photo ? <Icon className="text-ink-accent mb-6 h-7 w-7" aria-hidden /> : null}

                <span
                  className={`text-xl leading-snug font-medium ${
                    photo ? "text-ink-inverse" : "text-ink"
                  }`}
                >
                  {service.name[locale]}
                </span>
                <span
                  className={`mt-3 text-[15px] leading-[1.6] transition-colors duration-[var(--motion-base)] ${
                    photo
                      ? "text-ink-inverse/70 group-hover:text-ink-inverse"
                      : "text-ink-secondary group-hover:text-ink"
                  }`}
                >
                  {service.short[locale]}
                </span>

                <span className="mt-7 flex items-end justify-between gap-4">
                  <span
                    data-numeric
                    /* Money renders its "ab"/"from" prefix in tertiary grey,
                       which is 2.65:1 on the dark card. Lift it with the rest
                       of the price rather than leaving the qualifier the one
                       unreadable word on the tile. */
                    className={`display-type text-[clamp(30px,3vw,40px)] leading-[0.85] ${
                      photo
                        ? "text-ink-inverse [&_span]:text-ink-inverse/70"
                        : "text-ink"
                    }`}
                  >
                    <Money amount={serviceFromPrice(service.minDuration)} from />
                  </span>
                  <span
                    aria-hidden
                    className="bg-accent text-ink-inverse grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform duration-400 group-hover:scale-110"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </span>
              </span>
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
