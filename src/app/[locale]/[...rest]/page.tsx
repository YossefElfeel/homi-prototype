import { notFound } from 'next/navigation';

/**
 * Catch-all so unmatched URLs reach *our* 404.
 *
 * Without it, `/en/anything` falls through to Next's built-in page — a bare
 * "404 | This page could not be found" with no header, no exits and no
 * translation. The designed 404 in `not-found.tsx` was never being served for
 * the case it exists for: a stale link from an old email.
 */
export default function CatchAllNotFound() {
  notFound();
}
