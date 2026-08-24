import type { MoneyUnit } from '@/components/ui/money';
import type { DataSet } from '@/mock/scenarios';
import { SERVICE_SLUGS } from '@/mock/schema';
import type {
  CalcMethod,
  DurationProfile,
  Plan,
  Service,
  ServiceStatus,
} from '@/mock/schema';

/**
 * The catalogue's rules, in one place.
 *
 * They were spread across the screens that happened to need them, and each
 * screen had its own answer. `s.active` was tested inline in nine files; the
 * admin list decided a service's billing label with a two-way ternary over a
 * three-way union; the rate was printed with `per="hour"` regardless of how
 * the service actually bills. None of that is catchable by types — a per-unit
 * service reading «CHF 49 / Std.» is a correct render of a wrong idea.
 */

/** Every status, in the order a human reads them. Mirrors the status registry. */
export const SERVICE_STATUSES: ServiceStatus[] = ['draft', 'active', 'inactive'];

export const CALC_METHODS: CalcMethod[] = ['hourly', 'perUnit', 'flat'];

export const DURATION_PROFILES: DurationProfile[] = [
  'standard',
  'deep',
  'moveout',
  'office',
  'none',
];

/**
 * Whether the public side may show it.
 *
 * The website, the request flow and the sitemap each wrote `s.active` by hand.
 * Now that a service can also be a draft, "not active" splits into two very
 * different reasons — and the one thing that must stay true is that neither
 * reaches a customer. One function so that stays one decision.
 */
export function isOffered(service: Service) {
  return service.status === 'active';
}

/**
 * Whether «auf der Website ansehen» has anything to open.
 *
 * /leistungen/[slug] is pre-rendered from the seed catalogue, and its long-form
 * copy — the lead, the included list, the FAQ — is keyed in `content/services`
 * by the seven original slugs. So a service the owner adds is a real, bookable,
 * billable service with no marketing page behind it, and offering the link
 * anyway would give the admin an action that lands on a 404 every time.
 *
 * Not a permanent shape: whether added services get a page, and where their
 * copy would live, is §17.2a on /open-questions.
 */
export function hasPublicPage(service: Service) {
  return isOffered(service) && (SERVICE_SLUGS as readonly string[]).includes(service.slug);
}

/**
 * What the base price is a price *of*.
 *
 * `<Money>` refuses a bare number, which is the point — but every catalogue
 * screen was answering the unit question with the literal `per="hour"`, so
 * window cleaning's per-window rate and a flat call-out fee both printed as an
 * hourly rate. The unit is a property of the billing method, not of the screen.
 */
export function calcUnit(calc: CalcMethod): MoneyUnit {
  switch (calc) {
    case 'hourly':
      return 'hour';
    case 'perUnit':
      return 'unit';
    case 'flat':
      /* Not 'none'. A flat price is per *job*, and «CHF 180.–» with nothing
         after it reads as a rate on a screen where every neighbouring row
         carries one. */
      return 'visit';
  }
}

/**
 * A URL segment from whatever the owner typed.
 *
 * German is the source because it is the market language and the fallback for
 * every other locale (§20.6) — deriving the slug from the English name would
 * give an untranslated service no slug at all. Umlauts are transliterated
 * rather than stripped: «Büroreinigung» has to become `bueroreinigung`, the
 * slug the seven seeded services already use, not `broreinigung`.
 */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** `slug`, `slug-2`, `slug-3` — never a collision with an existing service. */
export function uniqueSlug(base: string, services: Service[], ignoreId?: string) {
  const taken = new Set(
    services.filter((s) => s.id !== ignoreId).map((s) => s.slug),
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export interface ServiceUsage {
  requests: number;
  bookings: number;
  plans: number;
  total: number;
}

/**
 * What would break if this service were deleted.
 *
 * A `Booking` names its service by slug, not by id, so removing the row does
 * not orphan a foreign key — it makes every job, request and package that
 * points at it unreadable, quietly and with no error anywhere. The count is
 * what the confirm step shows instead of asking "are you sure" about a number
 * nobody can see, and it is why deletion is refused rather than cascaded:
 * cascading here would delete invoiced work.
 */
export function serviceUsage(
  slug: string,
  data: DataSet,
  plans: Plan[],
): ServiceUsage {
  const requests = data.requests.filter((r) => r.serviceSlug === slug).length;
  const bookings = data.bookings.filter((b) => b.serviceSlug === slug).length;
  const planCount = plans.filter((p) => p.serviceSlug === slug).length;
  return {
    requests,
    bookings,
    plans: planCount,
    total: requests + bookings + planCount,
  };
}
