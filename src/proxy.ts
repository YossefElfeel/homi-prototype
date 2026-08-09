import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

/**
 * Locale negotiation and prefixing. Next 16 renamed this convention from
 * `middleware` to `proxy`; the handler itself is unchanged.
 */
export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
