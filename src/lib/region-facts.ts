import type { DataSet } from '@/mock/scenarios';
import type { ServedRegion } from '@/mock/engines/coverage';

/**
 * What a served municipality is holding, so removing one is a decision rather
 * than a click.
 *
 * A postcode is not a foreign key. Properties, customer addresses and job
 * applications all store the four digits as plain text, so deleting the region
 * row breaks nothing that a type or a lookup would notice — it changes what
 * `checkCoverage` answers. Every address in that town starts reading as
 * «ausserhalb des Einsatzgebiets», the request flow refuses them at the
 * postcode field, and the objects, jobs and invoices already on file go on
 * existing in a place the company no longer says it serves. Silent, correct
 * per the code, and wrong.
 *
 * So the settings screen counts first and refuses with the number, the same
 * way the catalogue refuses to delete a service that has been booked. What it
 * does offer instead is the switch that was always there: an area can be
 * turned *off*, which stops new requests without rewriting history.
 */
export interface RegionUsage {
  properties: number;
  customers: number;
  applications: number;
  total: number;
}

export function regionUsage(postcode: string, data: DataSet): RegionUsage {
  const properties = data.properties.filter((p) => p.postcode === postcode).length;
  const customers = data.customers.filter((c) => c.address?.postcode === postcode).length;
  const applications = data.applications.filter((a) => a.postcode === postcode).length;

  return {
    properties,
    customers,
    applications,
    total: properties + customers + applications,
  };
}

/**
 * The eight seeded areas are the SEO surface §6 is emphatic about, and this
 * says which rows the prototype shipped with.
 *
 * Not a lock. An owner may remove a seeded area exactly as they may remove one
 * they added — the business genuinely might stop serving Grüningen. What it
 * buys is the sentence on the confirm step: a seeded area has a statically
 * rendered `/areas/<slug>` page behind it that will keep answering until the
 * next build, and removing the row without saying so would leave a live page
 * advertising a town the request flow now refuses.
 */
export function isSeededRegion(slug: string, seeded: ServedRegion[]): boolean {
  return seeded.some((region) => region.slug === slug);
}
