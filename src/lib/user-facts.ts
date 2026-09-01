/**
 * What may be done *to* a user account, and what happens to their trail.
 *
 * `admin-permissions.ts` answers "may this person open that screen". This
 * answers the other half — "may this person be switched off, and may this row
 * be deleted" — and the two are genuinely different questions. The owner is
 * unstoppable in the first and untouchable in the second.
 *
 * Every refusal carries *why*, in the same shape `invoice-permissions.ts` uses,
 * because the screen needs different words for each: "you cannot do this to
 * yourself" and "this account has nine months of work behind it" are not the
 * same sentence and a greyed button says neither.
 */

import { labourExpenses } from '@/lib/labour-facts';
import type {
  Booking,
  CalendarEvent,
  ChangeLogEntry,
  Expense,
  TeamMember,
} from '@/mock/schema';

export type UserAction = 'edit' | 'permissions' | 'deactivate' | 'reactivate' | 'delete' | 'reset';

/**
 * `self` — the office cannot lock itself out of its own console.
 * `owner` — the account the company hangs off is not an ordinary row.
 * `history` — deleting would orphan records that name this person.
 * `state` — already in the state the action would produce.
 */
export type UserDenial = 'self' | 'owner' | 'history' | 'state';

export type UserPermission = { allowed: true } | { allowed: false; because: UserDenial };

const YES: UserPermission = { allowed: true };
const no = (because: UserDenial): UserPermission => ({ allowed: false, because });

/**
 * What a deactivation deliberately leaves behind.
 *
 * The requirement is blunt — switching an account off must not delete their
 * jobs, their costs or their activity — and a promise like that is worth
 * nothing as a sentence in a dialog. So the dialog counts it: this is what the
 * screen puts in front of the reader before they confirm, and the same numbers
 * are what makes `delete` refuse further down.
 *
 * It is deliberately the *whole* trail rather than the open part of it. A
 * finished job from March is exactly the record somebody comes looking for in
 * October, and "completed, so it does not matter" is the reasoning that loses
 * it.
 */
export interface UserHistory {
  bookings: number;
  events: number;
  /**
   * Hours booked against this person, as rows rather than as a sum.
   *
   * This is the money half, and it is the one that makes the promise concrete:
   * a labour row says who worked, for how long, and whether they have been paid
   * — so deleting the account behind it would orphan an amount somebody is
   * still owed. Counted here so `delete` refuses on it, and shown on the record
   * as hours and francs by the block further down the page.
   */
  labour: number;
  logEntries: number;
  total: number;
}

export function userHistory(
  member: TeamMember,
  data: {
    bookings: Booking[];
    events: CalendarEvent[];
    expenses: Expense[];
    changeLog: ChangeLogEntry[];
  },
): UserHistory {
  const bookings = data.bookings.filter((b) => b.assigneeId === member.id).length;
  const events = data.events.filter((e) => e.assigneeId === member.id).length;
  const labour = labourExpenses(data.expenses).filter(
    (e) => e.labour.workerId === member.id,
  ).length;
  /* The log names its actor rather than pointing at an id — see `logChange`.
     Matching on the name is the only join there is, and it is the right one:
     the entry says who did it, and that stays true after the account goes. */
  const name = fullName(member);
  const logEntries = data.changeLog.filter((e) => e.actor === name).length;

  return {
    bookings,
    events,
    labour,
    logEntries,
    total: bookings + events + labour + logEntries,
  };
}

/**
 * Jobs still ahead of a person who is being switched off.
 *
 * Deactivation does not cancel them and does not reassign them — that is a
 * decision about a customer's Tuesday, not about an account, and the prototype
 * refuses to make it silently. What it does instead is say the number out loud
 * at the moment of the decision, with a way through to the calendar.
 */
export function upcomingJobs(member: TeamMember, bookings: Booking[], now: Date): Booking[] {
  return bookings
    .filter((b) => b.assigneeId === member.id && new Date(b.start) >= now)
    .sort((a, b) => (a.start < b.start ? -1 : 1));
}

export function userPermission(
  action: UserAction,
  {
    actor,
    target,
    history,
  }: { actor: TeamMember | undefined; target: TeamMember; history?: UserHistory },
): UserPermission {
  const isSelf = actor?.id === target.id;

  switch (action) {
    /*
     * Editable, including your own — correcting your own phone number is not a
     * privilege escalation, and sending somebody to another screen to do it is
     * how a wrong number stays wrong.
     */
    case 'edit':
      return YES;

    /* The owner's rights are not stored, so there is nothing to edit; and
       editing your own is the escalation `users` is owner-only to prevent. */
    case 'permissions':
      if (target.role === 'owner') return no('owner');
      if (isSelf) return no('self');
      return YES;

    case 'deactivate':
      if (!target.active) return no('state');
      if (target.role === 'owner') return no('owner');
      if (isSelf) return no('self');
      return YES;

    case 'reactivate':
      return target.active ? no('state') : YES;

    /*
     * Delete is real — the row goes, and nothing archives it.
     *
     * So it is offered only where it destroys nothing: an account typed in
     * wrong ten minutes ago, a person who never started. The moment anything
     * names them, deactivation is the honest action and this one refuses and
     * says which records it would have orphaned. Customers get an archive for
     * the same reason; a user has no list to be archived *into*, which is why
     * this is a refusal rather than a second soft state nobody can see.
     */
    case 'delete':
      if (target.role === 'owner') return no('owner');
      if (isSelf) return no('self');
      if (history && history.total > 0) return no('history');
      return YES;

    /* A link for an account that is switched off would sign nobody in. */
    case 'reset':
      return target.active ? YES : no('state');
  }
}

export function mayUser(
  action: UserAction,
  args: { actor: TeamMember | undefined; target: TeamMember; history?: UserHistory },
): boolean {
  return userPermission(action, args).allowed;
}

export function fullName(member: Pick<TeamMember, 'firstName' | 'lastName'>): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

/** Does this person get offered jobs? The one caller-facing form of the role. */
export function doesFieldWork(member: Pick<TeamMember, 'role'>): boolean {
  return member.role !== 'office';
}

/**
 * How long a reset link is good for.
 *
 * Two hours rather than a day. The office generates one while the person is on
 * the phone, and a link that outlives the call is a link sitting in an inbox
 * for a colleague to find.
 */
export const RESET_LINK_HOURS = 2;

export function resetLinkExpired(
  reset: TeamMember['passwordReset'],
  now: Date,
): boolean {
  return !reset || new Date(reset.expiresAt) <= now;
}

/**
 * The path the link points at.
 *
 * A real route, not a fabricated host: screen 34 exists, it is the screen a
 * customer reaches from «Passwort vergessen?», and it is where this token would
 * land. Pointing somewhere that 404s would make the one thing this feature
 * hands over — a link somebody pastes into a chat — the one thing that does not
 * work.
 */
export function resetLinkPath(token: string): string {
  return `/passwort?token=${token}&von=admin`;
}
