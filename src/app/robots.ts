import type { MetadataRoute } from 'next';

/**
 * What a crawler may read, and where the map is.
 *
 * The disallow list is not a security measure — none of these are reachable
 * without a session anyway. It is there so a crawler does not spend its budget
 * on an operations console it cannot see, and so single-use links (an offer
 * addressed to one customer, a password reset) never end up in an index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/konto', '/einsatz', '/offerte', '/passwort', '/anmelden'],
    },
    sitemap: 'https://homivaro.ch/sitemap.xml',
  };
}
