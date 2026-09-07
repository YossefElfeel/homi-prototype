import type { Application, ID } from '@/mock/schema';

export interface PostingUsage {
  /** Everybody who applied for this job — rejected and hired included. */
  applications: number;
  /**
   * Of those, the ones still waiting for an answer. Not a second rule — the
   * block is `total` — but «three applications» and «three, one of them still
   * unanswered» are two different amounts of urgency to the person deciding,
   * and the refusal can afford the second sentence.
   */
  open: number;
  /** What refuses the deletion. */
  total: number;
}

/**
 * What would break if this job were deleted.
 *
 * The same shape and the same reasoning as `planUsage`: an `Application` names
 * its job by id, so removing the posting throws nowhere — it changes what two
 * screens say about records that are still there, quietly and wrongly.
 *
 * The damage is worth naming, because it is not a blank. /admin/applications
 * and the applicant screen both render the job as
 * `postings.find(p => p.id === a.postingId)`, and fall through to
 * «Spontanbewerbung» when the lookup misses. Delete the posting and a person
 * who answered a specific advert is relabelled as somebody who wrote in
 * unprompted — a sentence the record itself contradicts, because
 * `Application.spontaneous` is still `false`. Worse on the list: its job filter
 * is built from the postings that exist plus one «spontan» option that tests
 * `!a.postingId`, so those applications match no option in it at all. They are
 * in the table and unreachable by any filter.
 *
 * Rejected and hired applications count. That is the part worth being explicit
 * about: the applicant screen keeps the rejection and the account it turned
 * into, and both read the job's title off this id. Unpublishing is the act for
 * a job that has been advertised — it stops taking applications and keeps the
 * ones it took. Deleting is for the job created by mistake, and that is the
 * only job it lets through.
 */
export function postingUsage(postingId: ID, applications: Application[]): PostingUsage {
  const named = applications.filter((a) => a.postingId === postingId);
  const open = named.filter((a) => a.status === 'new' || a.status === 'inReview').length;
  return { applications: named.length, open, total: named.length };
}
