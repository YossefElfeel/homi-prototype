/**
 * Who may open what in the panel, in one table.
 *
 * `status-registry.ts` exists because one state wearing two colours was a bug
 * review kept missing. This exists for the mirror-image problem: the sidebar
 * was a list of twenty-two destinations written in `admin-shell.tsx`, and the
 * rule for who could reach them was a single line — `role !== 'owner'` — a
 * screen away from it. Nothing tied the two together, so a new screen joined
 * the navigation without anybody deciding who was allowed on it.
 *
 * Both halves live here now, and they are the same list. `AREAS` is what the
 * sidebar renders *and* what the rights editor offers, so an area cannot exist
 * in one and be missing from the other. `ADMIN_PERMISSIONS` in `schema.ts` is
 * the key set; every map below is a `Record` over it, which is what turns
 * "remember to add the new tab to the permission screen" into a build error.
 *
 * Three things this file deliberately does *not* decide:
 *
 *  · **What the owner may do.** Nothing. The owner is not a row in a matrix —
 *    see `grantedPermissions`, which never reads their stored array.
 *  · **Whether a person is *this* person.** Self-protection (you cannot
 *    deactivate or delete yourself) is about the record, not the route, and
 *    lives in `user-facts.ts`.
 *  · **What a screen does once you are on it.** An invoice you may open is
 *    still an invoice you may not approve — `invoice-permissions.ts` keeps
 *    answering that, and it answers it per status as well as per role.
 */

import { ADMIN_PERMISSIONS, type AdminPermission, type TeamMember } from '@/mock/schema';

export type PermissionGroup =
  | 'operations'
  | 'customers'
  | 'finance'
  | 'content'
  | 'hiring'
  | 'system';

/** Sidebar order, and so rights-editor order. The two must not disagree. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  'operations',
  'customers',
  'finance',
  'content',
  'hiring',
  'system',
];

export interface PanelArea {
  permission: AdminPermission;
  group: PermissionGroup;
  /** Where the sidebar sends you, and the prefix every child route shares. */
  href: string;
  /**
   * Rights nobody can be granted, only inherited by being the owner. The
   * reason is on the entry rather than in a comment, because the rights editor
   * prints it beside the switch it has disabled — a greyed row with no
   * sentence next to it is the thing that generates the support call.
   */
  ownerOnly?: 'privacy' | 'escalation';
}

/**
 * Every gated area of the panel.
 *
 * `/admin` itself is absent on purpose — see the note on `ADMIN_PERMISSIONS`.
 * So are the two screens that hang off no navigation entry: `/admin/suche`
 * follows whatever the reader may already search, and `/admin/anmelden` is
 * outside the panel entirely.
 */
export const AREAS: PanelArea[] = [
  { permission: 'requests', group: 'operations', href: '/admin/anfragen' },
  { permission: 'offers', group: 'operations', href: '/admin/offerten' },
  { permission: 'bookings', group: 'operations', href: '/admin/buchungen' },
  { permission: 'calendar', group: 'operations', href: '/admin/kalender' },

  { permission: 'customers', group: 'customers', href: '/admin/kunden' },
  { permission: 'messages', group: 'customers', href: '/admin/nachrichten' },
  { permission: 'properties', group: 'customers', href: '/admin/objekte' },
  { permission: 'keys', group: 'customers', href: '/admin/schluessel' },
  { permission: 'subscriptions', group: 'customers', href: '/admin/abos' },

  { permission: 'invoices', group: 'finance', href: '/admin/rechnungen' },
  { permission: 'expenses', group: 'finance', href: '/admin/ausgaben' },
  { permission: 'analytics', group: 'finance', href: '/admin/finanzen' },

  { permission: 'catalogue', group: 'content', href: '/admin/leistungen' },
  { permission: 'addons', group: 'content', href: '/admin/zusatzleistungen' },
  { permission: 'coupons', group: 'content', href: '/admin/gutscheine' },
  { permission: 'reviews', group: 'content', href: '/admin/bewertungen' },
  { permission: 'templates', group: 'content', href: '/admin/vorlagen' },

  /*
   * revDSG. An application carries a work permit, a date of birth and whatever
   * the person chose to write about why they want the job — from somebody who
   * has not been hired and may never be. `canSeeApplicants` has always said
   * owner-only; before this file that was a claim inside one function, and the
   * moment a second role could reach the panel it would have needed a second
   * enforcement point. Now it is a property of the area.
   */
  {
    permission: 'applications',
    group: 'hiring',
    href: '/admin/bewerbungen',
    ownerOnly: 'privacy',
  },
  { permission: 'postings', group: 'hiring', href: '/admin/stellen' },

  /*
   * The right to grant rights.
   *
   * Grantable, this permission is every other permission: anybody holding it
   * opens their own record and ticks the rest. That is not a trade the office
   * can usefully weigh up per person, so it is not offered — the matrix is only
   * worth the paper it is on if one cell cannot rewrite all the others.
   */
  {
    permission: 'users',
    group: 'system',
    href: '/admin/benutzer',
    ownerOnly: 'escalation',
  },
  { permission: 'settings', group: 'system', href: '/admin/einstellungen' },
  { permission: 'changelog', group: 'system', href: '/admin/protokoll' },
];

const BY_PERMISSION = new Map(AREAS.map((area) => [area.permission, area]));

/**
 * Compile-time proof that every key in the schema's list has an area here.
 *
 * `Record<AdminPermission, PanelArea>` cannot be satisfied by a map with a
 * hole in it, so adding a permission and forgetting its route fails the build
 * rather than rendering a sidebar entry that goes nowhere.
 */
const AREA_BY_PERMISSION: Record<AdminPermission, PanelArea> = Object.fromEntries(
  ADMIN_PERMISSIONS.map((key) => {
    const area = BY_PERMISSION.get(key);
    if (!area) throw new Error(`No panel area declared for permission "${key}"`);
    return [key, area];
  }),
) as Record<AdminPermission, PanelArea>;

export function areaFor(permission: AdminPermission): PanelArea {
  return AREA_BY_PERMISSION[permission];
}

export function areasInGroup(group: PermissionGroup): PanelArea[] {
  return AREAS.filter((area) => area.group === group);
}

/** Rights that exist but cannot be handed out. */
export const GRANTABLE_PERMISSIONS: AdminPermission[] = AREAS.filter(
  (area) => !area.ownerOnly,
).map((area) => area.permission);

/**
 * What this person may open — the one answer, for every caller.
 *
 * The owner's array is never read. Their rights are not stored anywhere,
 * because a stored list is a list that can go stale: grant the owner the
 * twenty-two of today, add a twenty-third screen next month, and the person who
 * owns the company is locked out of it until somebody notices. Being the owner
 * *is* the permission.
 *
 * A deactivated account grants nothing, whatever the record says. That is the
 * point of deactivation — and it is also why the record keeps its rights while
 * switched off: turning somebody back on has to restore what they had, not hand
 * the office a blank matrix to rebuild from memory.
 */
export function grantedPermissions(member: TeamMember | undefined): AdminPermission[] {
  if (!member || !member.active) return [];
  if (member.role === 'owner') return [...ADMIN_PERMISSIONS];
  /*
   * Filtered rather than trusted: an owner-only right sitting on a contractor —
   * from a seed, or from a role changed after the fact — must not be honoured
   * just because it is written down.
   *
   * The `Array.isArray` is for a record that predates the field. `SCHEMA_VERSION`
   * was bumped for exactly that and throws the old blob away, so this should be
   * unreachable — but the failure it guards against is every screen in the panel
   * becoming a locked door, which is a bad thing to have depend on somebody
   * having remembered to bump a number.
   */
  if (!Array.isArray(member.permissions)) return [];
  return member.permissions.filter((key) => !areaFor(key).ownerOnly);
}

export function may(member: TeamMember | undefined, permission: AdminPermission): boolean {
  return grantedPermissions(member).includes(permission);
}

/** Can this person open the console at all? `/admin` on its own is not enough. */
export function canOpenPanel(member: TeamMember | undefined): boolean {
  return grantedPermissions(member).length > 0;
}

/**
 * Which right a URL needs, or `null` for the screens that need none.
 *
 * Longest prefix wins, though today no two areas nest. Matching on the path
 * rather than wiring a guard into each of the fifty-eight page files is the
 * whole reason this is enforceable: a screen added under `/admin/rechnungen`
 * next month is gated the moment it exists, by nobody remembering anything.
 */
export function permissionForPath(pathname: string): AdminPermission | null {
  /* `usePathname` from next-intl hands back a path with the locale already
     stripped — but `window.location` would not, so both shapes are accepted
     rather than one of them silently matching nothing. */
  const path = pathname.replace(/^\/(?:de|en|fr|it)(?=\/|$)/, '') || '/';

  let match: PanelArea | null = null;
  for (const area of AREAS) {
    if (path === area.href || path.startsWith(`${area.href}/`)) {
      if (!match || area.href.length > match.href.length) match = area;
    }
  }
  return match?.permission ?? null;
}

/**
 * The starting points the office actually reaches for, in that order.
 *
 * Not roles. A preset fills the matrix and is then free to be edited — the
 * brief's own examples are «Rechnungen + Ausgaben» and «Ausgaben + Finanzen»,
 * two different people in the same job, which as roles would need two roles to
 * express one. Ticking a box after applying a preset does not put an account in
 * a wrong state; it puts it in its own.
 */
export type PresetKey = 'full' | 'operations' | 'finance' | 'content' | 'field';

export const PRESETS: Record<PresetKey, AdminPermission[]> = {
  /* "Full admin access", as far as an account that is not the owner can go —
     everything except the two rights above. Calling it «Voller Zugriff» and
     quietly excluding those would be a lie the screen tells every time it is
     opened, so the screen says which two and why instead. */
  full: GRANTABLE_PERMISSIONS,
  operations: [
    'requests',
    'offers',
    'bookings',
    'calendar',
    'customers',
    'messages',
    'properties',
    'keys',
  ],
  finance: ['invoices', 'expenses', 'analytics', 'customers'],
  content: ['catalogue', 'addons', 'coupons', 'reviews', 'templates', 'postings'],
  /* Somebody who works from the field screens and needs to read their own week
     without being able to price it. */
  field: ['calendar', 'bookings'],
};

export const PRESET_KEYS: PresetKey[] = ['full', 'operations', 'finance', 'content', 'field'];

/** Which preset a set of rights *is*, when it is exactly one of them. */
export function matchingPreset(permissions: AdminPermission[]): PresetKey | null {
  const set = new Set(permissions);
  for (const key of PRESET_KEYS) {
    const preset = PRESETS[key];
    if (preset.length === set.size && preset.every((p) => set.has(p))) return key;
  }
  return null;
}
