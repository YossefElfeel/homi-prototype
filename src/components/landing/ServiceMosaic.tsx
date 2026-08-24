"use client";

import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { useLocale } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Money } from "@/components/ui/money";
import { ArrowUpRight } from "@/components/landing/icons";
import { EASE, inViewLoose } from "@/components/landing/motion";
import { SERVICE_ICONS, serviceFromPrice } from "@/components/site/service-grid";
import { SEED_SERVICES } from "@/mock/seed";

/** The three photographs the design shipped, on the three services they show. */
const PHOTO: Partial<Record<string, string>> = {
  unterhaltsreinigung: "/img/service-1.webp",
  umzugsreinigung: "/img/service-2.webp",
  moebelmontage: "/img/service-3.webp",
};

const COLUMNS = 3;

/**
 * Spelled out rather than interpolated, because Tailwind reads class names as
 * literals — `lg:col-span-${span}` compiles to nothing at all and the tile
 * silently falls back to one column.
 *
 * A closing tile does take all three: with seven services the last one is
 * alone on its row, and without the span-3 entry here it sat at one third
 * width with two empty cells beside it — the hole `bentoCells` exists to
 * prevent, reintroduced one layer down.
 */
const SPAN_CLASS: Record<number, string> = {
  1: '',
  2: 'sm:col-span-2',
  3: 'sm:col-span-2 lg:col-span-3',
};

/**
 * How wide each tile sits, so the bento tiles cleanly whatever the office
 * leaves active.
 *
 * A bento with a hole in it is not a bento, it is a grid that failed — and the
 * hole is exactly what a fixed list of spans produces the first time somebody
 * retires a service in the panel. So the widths are computed: a repeating
 * wide-narrow-narrow-wide rhythm, narrowed wherever a wide tile would overhang
 * the row it is in, and the closing tile stretched to whatever its row has
 * left. No number of services can leave a gap.
 */
function bentoCells(count: number): { span: number; column: number }[] {
  const rhythm = [2, 1, 1, 2];
  const cells: { span: number; column: number }[] = [];
  let filled = 0;

  for (let i = 0; i < count; i++) {
    const column = filled % COLUMNS;
    let span = rhythm[i % rhythm.length]!;

    if (column + span > COLUMNS) span = COLUMNS - column;
    // The closing tile takes the rest of its row — the wide bottom edge a
    // bento wants, and the only way to end without a stub.
    if (i === count - 1) span = COLUMNS - column;

    cells.push({ span, column });
    filled += span;
  }

  return cells;
}

/**
 * `amount` counts a fraction of the *element*, and these tiles are tall, so a
 * container-level trigger asks for more of the grid on screen than a laptop
 * has — which is how the first tiles came to sit at `opacity: 0` while fully
 * in view. Each tile triggers on itself, and the delay is indexed off its
 * column so a row reveals as a row instead of accumulating down a grid that no
 * longer reads as one.
 */
const tileRise: Variants = {
  hidden: { opacity: 0, y: 34, scale: 0.985 },
  show: (col: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: EASE, delay: col * 0.07 },
  }),
};

/**
 * The services as a bento of photo tiles.
 *
 * The card is one shape now — photograph edge to edge, the name and the
 * from-price sitting on it at the bottom left, the arrow in a red disc at the
 * bottom right. It was two shapes before: a photo tile put its picture in a
 * 220px band above a block of text while a flat tile had no picture at all, so
 * a row read as a banner standing next to a card rather than as one grid. The
 * rhythm comes from the cell widths now, which is where a bento is meant to
 * get it.
 *
 * **Four of the seven services have no photograph, and they are not given
 * one.** They take the same tile in navy with the service's icon where the
 * picture would be. Borrowing a kitchen for "Window cleaning" would be the one
 * dishonest thing on a page whose whole job is to say what we do. The gap is
 * deliberate and it closes the day the photographs arrive: add the file to
 * `PHOTO` and nothing else here changes.
 *
 * The price is set in Bebas. A price is a numeral, so it clears the rule that
 * nothing in this direction sets Bebas below 36px for reading.
 */
export function ServiceMosaic({
  exclude,
  /** How many tiles to show. The bento re-tiles itself around whatever it gets. */
  limit,
}: {
  exclude?: string;
  limit?: number;
}) {
  const locale = useLocale() as Locale;

  const all = SEED_SERVICES.filter((s) => s.active && s.slug !== exclude).sort(
    (a, b) => a.order - b.order,
  );
  const items = limit ? all.slice(0, limit) : all;

  const cells = bentoCells(items.length);

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((service, i) => {
        const photo = PHOTO[service.slug];
        const { span, column } = cells[i]!;

        /* Next flagged the first tile as the Largest Contentful Paint on
           /leistungen and it was loading lazily. Only the first: marking all
           three would have them compete for the same early bandwidth. */
        const isLcp = i === 0 && Boolean(photo);
        const Icon = SERVICE_ICONS[service.slug];

        return (
          <motion.li
            key={service.slug}
            initial="hidden"
            whileInView="show"
            viewport={inViewLoose}
            variants={tileRise}
            custom={column}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className={`hv-card group relative min-h-[300px] overflow-hidden sm:min-h-[340px] lg:min-h-[380px] ${
              photo ? "bg-inverse" : "hv-card-dark"
            } ${SPAN_CLASS[span] ?? ""}`}
          >
            {photo ? (
              <>
                <Image
                  src={photo}
                  alt=""
                  fill
                  priority={isLcp}
                  sizes={
                    span === 2
                      ? "(max-width: 640px) 100vw, 66vw"
                      : "(max-width: 640px) 100vw, 33vw"
                  }
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                />
                {/* The scrim is the type's background, not a mood. Without it
                    a white name lands on whatever the photograph happens to be
                    doing at the bottom of the frame — on service-2 that is a
                    pale wall. Weighted to the bottom so the picture keeps the
                    top two thirds of the tile. */}
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(6,17,44,0.92) 0%, rgba(6,17,44,0.72) 26%, rgba(6,17,44,0.24) 58%, rgba(6,17,44,0.05) 100%)",
                  }}
                />
              </>
            ) : null}

            <Link
              href={`/leistungen/${service.slug}`}
              className="relative flex h-full flex-col justify-between p-7 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-line-focus"
            >
              {/* The icon stands in for the photograph, so it sits where the
                  photograph would begin rather than immediately above the
                  name. */}
              <span>
                {!photo ? <Icon className="text-ink-accent-inverse h-8 w-8" aria-hidden /> : null}
              </span>

              <span className="flex items-end justify-between gap-4">
                <span className="flex min-w-0 flex-col">
                  <span className="text-ink-inverse/85 text-[15px] leading-snug sm:text-base">
                    {service.name[locale]}
                  </span>
                  <span
                    data-numeric
                    /* Money renders its "ab"/"from" prefix in tertiary grey,
                       which is 2.65:1 over a photograph. Lift it with the rest
                       of the price rather than leaving the qualifier the one
                       unreadable word on the tile. */
                    className="display-type text-ink-inverse mt-1.5 text-[clamp(30px,3vw,42px)] leading-[0.85] [&_span]:text-ink-inverse/70"
                  >
                    <Money amount={serviceFromPrice(service.minDuration)} from />
                  </span>
                </span>

                <span
                  aria-hidden
                  className="bg-accent text-ink-inverse grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform duration-400 group-hover:scale-110"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </span>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
