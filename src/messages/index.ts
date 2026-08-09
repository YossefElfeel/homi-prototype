import { de as deCore } from './de';
import { en as enCore } from './en';
import { siteDe } from './site/de';
import { siteEn } from './site/en';
import { bookingDe } from './booking/de';
import { bookingEn } from './booking/en';
import { offerDe } from './offer/de';
import { offerEn } from './offer/en';
import { accountDe } from './account/de';
import { accountEn } from './account/en';
import { adminDe } from './admin/de';
import { adminEn } from './admin/en';
import { adminCrmDe } from './admin/crm.de';
import { adminCrmEn } from './admin/crm.en';
import { adminContentDe } from './admin/content.de';
import { adminContentEn } from './admin/content.en';
import { adminHiringDe } from './admin/hiring.de';
import { adminHiringEn } from './admin/hiring.en';
import { careersDe } from './careers/de';
import { careersEn } from './careers/en';

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
  account: accountDe,
  careers: careersDe,
  admin: { ...adminDe, ...adminCrmDe, ...adminContentDe, ...adminHiringDe },
};
export const en = {
  ...enCore,
  site: siteEn,
  booking: bookingEn,
  offer: offerEn,
  account: accountEn,
  careers: careersEn,
  admin: { ...adminEn, ...adminCrmEn, ...adminContentEn, ...adminHiringEn },
};

export type Messages = typeof de;
