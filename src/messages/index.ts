import { de as deCore } from './de';
import { en as enCore } from './en';
import { siteDe } from './site/de';
import { siteEn } from './site/en';
import { bookingDe } from './booking/de';
import { bookingEn } from './booking/en';
import { offerDe } from './offer/de';
import { offerEn } from './offer/en';
import { adminDe } from './admin/de';
import { adminEn } from './admin/en';

/**
 * Dictionaries are composed per domain rather than kept in one file — at 101
 * screens a single message object becomes unreviewable. Each wave adds a
 * namespace here (site, booking, offer, account, admin, careers, field).
 */
export const de = {
  ...deCore,
  site: siteDe,
  booking: bookingDe,
  offer: offerDe,
  admin: adminDe,
};
export const en = {
  ...enCore,
  site: siteEn,
  booking: bookingEn,
  offer: offerEn,
  admin: adminEn,
};

export type Messages = typeof de;
