'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState, useSyncExternalStore } from 'react';

import type {
  AddOn,
  Property,
  RequestDraft,
  Service,
  ServiceRequest,
  Settings,
  SlotHold,
} from './schema';
import { SEED_ADDONS, SEED_SERVICES, SEED_SETTINGS } from './seed';
import { buildScenario, type DataSet, type ScenarioName } from './scenarios';
import { checkCoverage } from './engines/coverage';

/**
 * The prototype's single source of truth.
 *
 * Persisted to localStorage so a reviewer can submit a request, switch to the
 * owner, answer it with a quote, switch back to the customer and see it —
 * across reloads. `SCHEMA_VERSION` throws the store away when the shape moves,
 * which is the right trade for a prototype.
 */
const SCHEMA_VERSION = 1;

export type DemoRole = 'visitor' | 'customer' | 'owner' | 'contractor';

interface DemoState {
  role: DemoRole;
  scenario: ScenarioName;
  /** ISO date the app should treat as "now". Drives lead-time and closure tests. */
  dateOverride: string | null;
  currentCustomerId: string;
  currentMemberId: string;
}

export function emptyDraft(): RequestDraft {
  return {
    serviceSlug: null,
    propertyId: null,
    property: {
      street: '',
      postcode: '',
      city: '',
      kind: 'apartment',
      area: null,
      rooms: null,
      bathrooms: null,
      floor: 0,
      hasElevator: false,
      hasPets: false,
      needsExtraEffort: false,
    },
    addOnIds: [],
    windowCount: null,
    furniturePieces: null,
    access: null,
    preferred: { flexible: false },
    photos: [],
    customerNote: '',
    contact: { firstName: '', lastName: '', email: '', phone: '', language: 'de' },
    acceptedTerms: false,
    acceptedPrivacy: false,
    subscriptionIntent: null,
    updatedAt: null,
  };
}

interface StoreState {
  data: DataSet;
  settings: Settings;
  services: Service[];
  addOns: AddOn[];
  holds: SlotHold[];
  demo: DemoState;
  draft: RequestDraft;

  updateDraft: (patch: Partial<RequestDraft>) => void;
  resetDraft: () => void;
  /** Turns the draft into a request. Returns the reference for the receipt. */
  submitDraft: (now: Date) => { reference: string; outOfArea: boolean };

  setRole: (role: DemoRole) => void;
  setScenario: (scenario: ScenarioName) => void;
  setDateOverride: (iso: string | null) => void;
  setCurrentCustomer: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  patchData: (patch: Partial<DataSet>) => void;
  addHold: (hold: SlotHold) => void;
  releaseHold: (id: string) => void;
  reset: () => void;
}

function initialDemo(): DemoState {
  return {
    role: 'visitor',
    scenario: 'demo',
    dateOverride: null,
    currentCustomerId: 'cus_1',
    currentMemberId: 'tm_owner',
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: buildScenario('demo', new Date()),
      settings: SEED_SETTINGS,
      services: SEED_SERVICES,
      addOns: SEED_ADDONS,
      holds: [],
      demo: initialDemo(),
      draft: emptyDraft(),

      updateDraft: (patch) =>
        set((s) => ({
          draft: { ...s.draft, ...patch, updatedAt: new Date().toISOString() },
        })),

      resetDraft: () => set({ draft: emptyDraft() }),

      /**
       * §8.3 — a request can be sent as a guest. The account is created when
       * the *quote* is sent, not here; matching on email or phone links the
       * request to an existing customer instead of creating a duplicate
       * (§20.1, "حسابان بنفس الشخص").
       */
      submitDraft: (now) => {
        const state = get();
        const { draft, data, settings } = state;

        const existing = data.customers.find(
          (c) =>
            c.email.toLowerCase() === draft.contact.email.toLowerCase() ||
            (draft.contact.phone && c.phone === draft.contact.phone),
        );

        const stamp = now.getTime().toString(36).toUpperCase().slice(-4);
        const customerId = existing?.id ?? `cus_${stamp}`;
        const customers = existing
          ? data.customers
          : [
              ...data.customers,
              {
                id: customerId,
                firstName: draft.contact.firstName,
                lastName: draft.contact.lastName,
                email: draft.contact.email,
                phone: draft.contact.phone,
                language: draft.contact.language,
                loginMethod: 'magic-link' as const,
                status: 'active' as const,
                createdAt: now.toISOString(),
                notifications: {
                  operational: true,
                  marketing: false,
                  channelEmail: true,
                  channelSms: true,
                },
              },
            ];

        let propertyId = draft.propertyId;
        let properties = data.properties;
        if (!propertyId) {
          propertyId = `prp_${stamp}`;
          const input = draft.property;
          const property: Property = {
            id: propertyId,
            customerId,
            label: input.street || 'Objekt',
            street: input.street,
            postcode: input.postcode,
            city: input.city,
            kind: input.kind,
            area: input.area ?? 0,
            rooms: input.rooms ?? 0,
            bathrooms: input.bathrooms ?? 1,
            floor: input.floor,
            hasElevator: input.hasElevator,
            hasPets: input.hasPets,
            needsExtraEffort: input.needsExtraEffort,
            access: draft.access ?? undefined,
          };
          properties = [...properties, property];
        }

        const postcode =
          properties.find((p) => p.id === propertyId)?.postcode ?? draft.property.postcode;
        const coverage = checkCoverage(postcode, settings.servedPostcodes);
        const outOfArea = coverage.state !== 'inside';

        const reference = `A-${(2500 + data.requests.length).toString()}`;
        const request: ServiceRequest = {
          id: `req_${stamp}`,
          reference,
          customerId,
          propertyId,
          serviceSlug: draft.serviceSlug!,
          addOnIds: draft.addOnIds,
          windowCount: draft.windowCount ?? undefined,
          furniturePieces: draft.furniturePieces ?? undefined,
          preferred: draft.preferred,
          photoIds: draft.photos.map((p) => p.id),
          customerNote: draft.customerNote || undefined,
          status: 'new',
          outOfArea,
          createdAt: now.toISOString(),
          subscriptionIntent: draft.subscriptionIntent ?? undefined,
        };

        set({
          data: {
            ...data,
            customers,
            properties,
            requests: [request, ...data.requests],
            photos: [
              ...data.photos,
              ...draft.photos.map((p) => ({
                id: p.id,
                src: `/placeholder/${p.id}.svg`,
                source: 'customer' as const,
                kind: 'context' as const,
                visibleToCustomer: true,
                publishConsent: false,
                note: p.note || undefined,
                requestId: request.id,
                takenAt: now.toISOString(),
              })),
            ],
          },
          draft: emptyDraft(),
          demo: { ...state.demo, currentCustomerId: customerId },
        });

        return { reference, outOfArea };
      },

      setRole: (role) => set((s) => ({ demo: { ...s.demo, role } })),

      setScenario: (scenario) =>
        set((s) => ({
          demo: { ...s.demo, scenario },
          data: buildScenario(scenario, effectiveNow(s.demo.dateOverride)),
          holds: [],
        })),

      setDateOverride: (dateOverride) =>
        set((s) => ({
          demo: { ...s.demo, dateOverride },
          // Seed data is written relative to "now", so moving the clock has to
          // rebuild it — otherwise today's jobs would sit in the past.
          data: buildScenario(s.demo.scenario, effectiveNow(dateOverride)),
          holds: [],
        })),

      setCurrentCustomer: (currentCustomerId) =>
        set((s) => ({ demo: { ...s.demo, currentCustomerId } })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      patchData: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),

      addHold: (hold) => set((s) => ({ holds: [...s.holds, hold] })),

      releaseHold: (id) => set((s) => ({ holds: s.holds.filter((h) => h.id !== id) })),

      reset: () =>
        set({
          data: buildScenario('demo', new Date()),
          settings: SEED_SETTINGS,
          services: SEED_SERVICES,
          addOns: SEED_ADDONS,
          holds: [],
          demo: initialDemo(),
          draft: emptyDraft(),
        }),
    }),
    {
      name: 'homivaro-prototype',
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: () => undefined as never,
    },
  ),
);

function effectiveNow(override: string | null) {
  return override ? new Date(override) : new Date();
}

/**
 * The clock every screen and engine reads.
 *
 * Real `Date.now()` unless the demo bar has pinned a date — that is how the
 * 24-hour lead time, closure periods and "contractor sees the alarm code only
 * on the job's own day" rule become testable instead of asserted.
 */
export function useNow(): Date {
  const override = useStore((s) => s.demo.dateOverride);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (override) return;
    const id = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [override]);

  return override ? new Date(override) : new Date(tick);
}

/**
 * Persisted state and the server render disagree by definition. Screens gate
 * on this and show their skeleton until the store is live, so we never ship a
 * hydration mismatch.
 *
 * `useSyncExternalStore` rather than an effect: hydration *is* an external
 * store, and setting state from an effect body here caused a cascading render
 * on every gated screen.
 */
const subscribeHydration = (onChange: () => void) =>
  useStore.persist.onFinishHydration(onChange);
const hydratedSnapshot = () => useStore.persist.hasHydrated();
const serverSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribeHydration, hydratedSnapshot, serverSnapshot);
}

/* ------------------------------------------------------------- selectors */

export function useRole() {
  return useStore((s) => s.demo.role);
}

export function useSettings() {
  return useStore((s) => s.settings);
}

/**
 * §13.1 — access codes are visible to the owner at all times, to the assigned
 * contractor **only on the day of the job**, and never to the customer-facing
 * surfaces. Enforced here rather than described in a note, so the demo can
 * prove it by moving the clock.
 */
export function canSeeAccessCodes(
  role: DemoRole,
  opts: { assignedToday: boolean } = { assignedToday: false },
) {
  if (role === 'owner') return true;
  if (role === 'contractor') return opts.assignedToday;
  return false;
}

/** revDSG: applicant data is owner-only. Contractors never see it. */
export function canSeeApplicants(role: DemoRole) {
  return role === 'owner';
}
