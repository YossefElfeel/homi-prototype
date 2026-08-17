'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState, useSyncExternalStore } from 'react';

import type { Locale } from '@/i18n/routing';
import type {
  AddOn,
  Application,
  ApplicationDraft,
  ApplicationStatus,
  Booking,
  Customer,
  CustomerMessage,
  ID,
  Invoice,
  InvoiceLine,
  JobPosting,
  TeamMember,
  Offer,
  OfferLine,
  Payment,
  PaymentMethod,
  PlanTier,
  PreferredTime,
  Property,
  RequestDraft,
  Service,
  ServiceRequest,
  ServiceSlug,
  Settings,
  SlotHold,
} from './schema';
import { SEED_ADDONS, SEED_SERVICES, SEED_SETTINGS } from './seed';
import { buildScenario, type DataSet, type ScenarioName } from './scenarios';
import { checkCoverage } from './engines/coverage';
import { createHold, type Slot } from './engines/availability';
import { buildOfferLines, offerHours, offerTotal } from './engines/offers';
import { arrivalWindowMinutes } from './engines/pricing';

/** Used only if the "offer-sent" template has been emptied on screen 79. */
const DEFAULT_OFFER_MESSAGE = `Guten Tag

vielen Dank für Ihre Anfrage. Nachfolgend finden Sie unsere Offerte, Position für Position aufgeschlüsselt. Der Betrag ist verbindlich; Zuschläge und Anfahrt sind – falls zutreffend – separat ausgewiesen.

Wählen Sie einen freien Termin, und wir bestätigen ihn sofort.

Freundliche Grüsse
Marco Brunner`;

/**
 * The prototype's single source of truth.
 *
 * Persisted to localStorage so a reviewer can submit a request, switch to the
 * owner, answer it with a quote, switch back to the customer and see it —
 * across reloads. `SCHEMA_VERSION` throws the store away when the shape moves,
 * which is the right trade for a prototype.
 */
// Bump whenever the shape of DataSet or the draft changes. `migrate` returns
// undefined, which makes Zustand discard the stored state and re-seed — the
// right trade for a prototype, and it prevents a stale localStorage from
// crashing on a field that did not exist yet.
/* 7: Review gained publishConsent and OfferLine gained displayLabel. A store
   persisted under 6 has reviews with no consent recorded, which the moderation
   screen would have to read as "not consented" — correct, but it would look
   like the seed was wrong rather than stale. Re-seeding is cleaner. */
const SCHEMA_VERSION = 7;

/**
 * §10 — payment term. Not in Settings: the settings screen is the owner's, and
 * nothing in the specification lets them move this. The seeded invoices use
 * the same 30 days.
 */
const INVOICE_TERM_DAYS = 30;

/**
 * Swiss QR-bill reference, schematic — the real one is a 27-digit number with
 * a mod-10 check digit. Enough to look right on screen 72 and to be searchable
 * on screen 84, which is all the prototype claims (see its own qrNote).
 */
function buildQrReference(seq: number) {
  const body = String(seq).padStart(21, '0');
  return `21 ${body.slice(0, 5)} ${body.slice(5, 10)} ${body.slice(10, 15)} ${body.slice(15, 20)} ${body.slice(20)}0000`.trim();
}

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

export function emptyApplicationDraft(): ApplicationDraft {
  return {
    postingId: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    postcode: '',
    city: '',
    permit: null,
    languages: {},
    hasDrivingLicence: false,
    hasCar: false,
    yearsExperience: null,
    experienceAreas: [],
    availability: { days: [], earliest: '07:00', latest: '18:00' },
    startFrom: '',
    references: [],
    documents: [],
    motivation: '',
    consent: false,
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
  applicationDraft: ApplicationDraft;

  updateDraft: (patch: Partial<RequestDraft>) => void;
  resetDraft: () => void;
  /** Turns the draft into a request. Returns the reference for the receipt. */
  submitDraft: (now: Date) => { reference: string; outOfArea: boolean };

  /* ---- admin-side intake (screens 64 + 52) ----
     A customer could only ever come into being as a side effect of the public
     wizard: `submitDraft` invents one from the contact step. So the owner of a
     phone-first local business had no way to write down the person who just
     called, and on day one — the empty scenario — /admin/kunden was a list with
     no way to put anything in it. */
  createCustomer: (
    input: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      language: Locale;
      internalNotes?: string;
    },
    now: Date,
  ) => ID;
  updateCustomer: (id: ID, patch: Partial<Customer>) => void;
  /** Shared by the admin property form and by admin intake. */
  createProperty: (
    input: Omit<Property, 'id'>,
    now: Date,
  ) => ID;
  /**
   * The same request the public wizard produces, entered by the owner on
   * behalf of a customer who phoned. Runs the identical coverage check, so an
   * out-of-area address is flagged here exactly as it is there.
   */
  createRequestForCustomer: (
    input: {
      customerId: ID;
      propertyId: ID;
      serviceSlug: ServiceSlug;
      addOnIds: ID[];
      windowCount?: number | null;
      furniturePieces?: number | null;
      preferred: PreferredTime;
      customerNote?: string;
      internalNote?: string;
      subscriptionIntent?: PlanTier | null;
      /**
       * A call that ended before the answers did. `RequestStatus` has carried
       * `draft` since the first wave — labelled, coloured, and written by
       * nothing, so a half-taken call had to be either invented in full or
       * thrown away.
       */
      asDraft?: boolean;
    },
    now: Date,
  ) => { id: ID; reference: string; outOfArea: boolean };
  /** Edits a request in place. Only ever used while it is still a draft. */
  updateRequest: (id: ID, patch: Partial<ServiceRequest>) => void;
  /** Draft → a real request in the queue. */
  submitRequestDraft: (id: ID, now: Date) => void;
  /** Discards a draft outright. Refuses anything further along. */
  discardRequestDraft: (id: ID) => void;

  /* ---- ending a request or a quote ----
     RequestStatus declared `cancelledByCustomer` and `cancelledByCompany`, the
     status registry gave both a colour and both were translated into DE and
     EN — and nothing in the app could reach either. Same for OfferStatus
     'rejected': the only exits from a quote were accept and request-a-change,
     so a customer who simply did not want it had no way to say so. */
  cancelRequest: (
    requestId: ID,
    by: 'customer' | 'company',
    reason: string,
    now: Date,
  ) => void;
  declineOffer: (offerId: ID, reason: string, now: Date) => void;

  /* ---- quote building (screens 54–56) ---- */
  /** Idempotent: returns the existing draft for a request, or creates one. */
  ensureDraftOffer: (requestId: ID, now: Date) => ID;
  updateOffer: (offerId: ID, patch: Partial<Offer>) => void;
  updateOfferLine: (offerId: ID, lineId: ID, patch: Partial<OfferLine>) => void;
  addOfferLine: (offerId: ID) => void;
  removeOfferLine: (offerId: ID, lineId: ID) => void;
  sendOffer: (offerId: ID, now: Date) => void;
  rejectRequest: (requestId: ID, reason: string, now: Date) => void;

  /* ---- offer acceptance (screens 23–31) ---- */
  toggleOfferLine: (offerId: ID, lineId: ID) => void;
  holdOfferSlot: (offerId: ID, slot: Slot, now: Date) => void;
  signOffer: (offerId: ID, now: Date) => void;
  /** Mock gateway. `outcome` decides which of the two states we land in. */
  payOffer: (
    offerId: ID,
    method: PaymentMethod,
    outcome: 'succeeded' | 'failed',
    now: Date,
  ) => { bookingReference?: string; failureReason?: string };
  requestOfferChange: (offerId: ID, message: string) => void;
  reissueOffer: (offerId: ID, now: Date) => void;

  /* ---- hiring (screens C3–C6, H1–H7) ---- */
  updateApplicationDraft: (patch: Partial<ApplicationDraft>) => void;
  resetApplicationDraft: () => void;
  /** Turns the draft into an application. Returns the reference for the receipt. */
  submitApplication: (now: Date) => { reference: string };
  setApplicationStatus: (id: ID, status: ApplicationStatus) => void;
  rejectApplication: (id: ID, reason: string) => void;
  /** revDSG — a real deletion, not an archive flag. */
  deleteApplication: (id: ID) => void;
  /** §2 — an accepted applicant becomes a contractor account. */
  convertApplicant: (id: ID, now: Date) => ID;
  updateApplication: (id: ID, patch: Partial<Application>) => void;
  /**
   * H3 had no create path at all — no button on the list, no action in its
   * empty state — and the default scenario seeds zero postings. So the screen
   * a reviewer lands on was terminal, and H4 (the editor) was unreachable
   * without switching scenario.
   */
  createPosting: (now: Date) => { id: ID; slug: string };
  updatePosting: (id: ID, patch: Partial<JobPosting>) => void;
  updateTeamMember: (id: ID, patch: Partial<TeamMember>) => void;

  /* ---- change log (screen 83) ----
     Nothing wrote to data.changeLog before this; the only entries in the whole
     app came from the seed. So the screen that promises to answer "since when
     has Saturday cost 25%?" could never answer it. */
  logChange: (entry: {
    entity: string;
    entityId: ID;
    summary: string;
    actor?: string;
    /** Replace the previous entry for the same record instead of appending —
        for autosaving screens, which would otherwise log every keystroke. */
    coalesce?: boolean;
  }) => void;

  /* ---- invoicing (screens 71–72) ----
     data.invoices used to be read-only: no path created one, no path edited a
     draft, and the word "paid" appeared nowhere outside the seed. */
  createInvoiceForBooking: (bookingId: ID, now: Date) => ID | null;
  updateInvoice: (id: ID, patch: Partial<Invoice>) => void;
  updateInvoiceLine: (id: ID, index: number, patch: Partial<InvoiceLine>) => void;
  addInvoiceLine: (id: ID) => void;
  removeInvoiceLine: (id: ID, index: number) => void;
  sendInvoice: (id: ID, now: Date) => void;
  markInvoicePaid: (id: ID, now: Date) => void;
  cancelInvoice: (id: ID, reason: string) => void;

  /* ---- field check in / out (screen 87) ----
     The screen enforced a three-photo minimum and then threw the photos away,
     along with the note and the reported extra hours. Nothing reached the
     store, and no timeline event was appended — so the booking detail in the
     panel showed no trace that anyone had been there. */
  recordCheck: (
    bookingId: ID,
    input: {
      kind: 'in' | 'out';
      photos: string[];
      note: string;
      /** §5.3 — reported for the office to price. Never charged here. */
      extraHours?: number | null;
    },
    now: Date,
  ) => void;

  /* ---- saved payment methods (screen 45) ----
     Add, remove and set-default were all local component state, so every
     change vanished on navigation. */
  addPaymentMethod: (
    input: { customerId: ID; kind: PaymentMethod; label: string },
    now: Date,
  ) => void;
  removePaymentMethod: (id: ID) => void;
  setDefaultPaymentMethod: (id: ID) => void;

  /* ---- subscriptions (screens 43 + 70) ----
     Both ends wrote different fields for the same act: the customer's cancel
     set only cancellationRequestedAt while the panel reads status, so a
     cancellation never appeared in admin. And "skip" only incremented a
     counter — no visit was ever actually skipped. */
  resumeSubscription: (id: ID) => void;
  /** Moves the next visit past the coming one and cancels its booking. */
  skipNextVisit: (id: ID, now: Date) => void;
  requestCancellation: (id: ID, now: Date) => void;

  /* ---- reviews (screens 46 + 78) ---- */
  submitReview: (
    input: {
      bookingId: ID;
      customerId: ID;
      rating: number;
      text: string;
      publishConsent: boolean;
    },
    now: Date,
  ) => void;
  setReviewStatus: (id: ID, status: 'pending' | 'published' | 'rejected') => void;
  replyToReview: (id: ID, reply: string) => void;

  /** Screen 88 — the no-access report, including whether the wait was shown. */
  recordNoAccess: (
    bookingId: ID,
    input: { reason: string; note: string; photo: boolean },
    now: Date,
  ) => void;

  /* ---- customer messages (screen 48 + its missing admin counterpart) ---- */
  sendMessage: (
    input: {
      customerId: ID;
      subject: string;
      body: string;
      from: CustomerMessage['from'];
    },
    now: Date,
  ) => void;
  markThreadRead: (customerId: ID, subject: string) => void;

  setRole: (role: DemoRole) => void;
  setScenario: (scenario: ScenarioName) => void;
  setDateOverride: (iso: string | null) => void;
  setCurrentCustomer: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** §17.2 — the catalogue is editable, and edits reach the site immediately. */
  setServices: (services: Service[]) => void;
  setAddOns: (addOns: AddOn[]) => void;
  patchData: (patch: Partial<DataSet>) => void;
  addHold: (hold: SlotHold) => void;
  releaseHold: (id: string) => void;
  reset: () => void;
}

/**
 * Re-point "who am I" after the dataset is rebuilt.
 *
 * Switching scenario or moving the clock throws the data away and builds it
 * again, which can delete the very customer or team member the demo bar is
 * currently standing in. Left alone, the account screens greet nobody and the
 * field screens show an empty day that looks like a bug rather than a state.
 *
 * A contractor with no contractor in the scenario resolves to *nobody* rather
 * than falling back to the owner: showing the owner's day through a
 * contractor's permissions is exactly the confusion the role gate exists to
 * prevent, and "no jobs" is the honest answer for a company that has not hired
 * anyone yet.
 */
function repoint(demo: DemoState, data: DataSet): DemoState {
  const wantedRole = demo.role === 'contractor' ? 'contractor' : 'owner';
  const current = data.team.find((m) => m.id === demo.currentMemberId);

  return {
    ...demo,
    currentCustomerId: data.customers.some((c) => c.id === demo.currentCustomerId)
      ? demo.currentCustomerId
      : (data.customers[0]?.id ?? ''),
    currentMemberId:
      current?.role === wantedRole
        ? demo.currentMemberId
        : (data.team.find((m) => m.role === wantedRole)?.id ?? ''),
  };
}

function initialDemo(): DemoState {
  return {
    role: 'visitor',
    scenario: 'demo',
    dateOverride: null,
    // The demo account. cus_2 is the only seeded customer with a request, a
    // subscription, an invoice and an hour credit at once, so every account
    // screen has something to show without switching customer first.
    currentCustomerId: 'cus_2',
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
      applicationDraft: emptyApplicationDraft(),

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

        /*
         * Length-prefixed, like every other id in this store. A bare stamp is
         * not unique here: `useNow` ticks every 30 seconds, and the demo clock
         * can be pinned outright — with a fixed date, two requests submitted
         * in one session came out with the same id, and the second shadowed
         * the first everywhere `find` is used.
         */
        const stamp = now.getTime().toString(36).slice(-4);
        const customerId = existing?.id ?? `cus_${data.customers.length}_${stamp}`;
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
          propertyId = `prp_${data.properties.length}_${stamp}`;
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
          id: `req_${data.requests.length}_${stamp}`,
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

      /* ---------------------------------------------- admin-side intake ---- */

      createCustomer: (input, now) => {
        const s = get();
        /*
         * Length first, then the clock. `useNow` ticks every 30 seconds and
         * the demo clock can be pinned outright, so a bare timestamp is not
         * unique — add a customer and their property in one sitting and both
         * ids come out identical. `find` then returns the wrong record and the
         * request quietly points at somebody else's address. The subscription
         * screen already learned this; the same shape is used here.
         */
        const id = `cus_${s.data.customers.length}_${now.getTime().toString(36).slice(-4)}`;

        const customer: Customer = {
          id,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          language: input.language,
          /*
           * §8.3 — the same login method `submitDraft` gives a customer it
           * invents. A record the office typed in is not a record that chose a
           * password, and offering one here would put a credential on file
           * that the person themselves never set.
           */
          loginMethod: 'magic-link',
          status: 'active',
          createdAt: now.toISOString(),
          notifications: {
            operational: true,
            marketing: false,
            channelEmail: true,
            channelSms: true,
          },
          internalNotes: input.internalNotes?.trim() || undefined,
        };

        set({ data: { ...s.data, customers: [customer, ...s.data.customers] } });
        get().logChange({
          entity: 'customer',
          entityId: id,
          summary: `Kunde angelegt: ${customer.firstName} ${customer.lastName}`,
        });
        return id;
      },

      updateCustomer: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            customers: s.data.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        })),

      createProperty: (input, now) => {
        const s = get();
        const id = `prp_${s.data.properties.length}_${now.getTime().toString(36).slice(-4)}`;

        set({
          data: { ...s.data, properties: [...s.data.properties, { ...input, id }] },
        });
        get().logChange({
          entity: 'property',
          entityId: id,
          summary: `Objekt angelegt: ${input.label || input.street}`,
        });
        return id;
      },

      createRequestForCustomer: (input, now) => {
        const s = get();
        const property = s.data.properties.find((p) => p.id === input.propertyId);
        const coverage = checkCoverage(property?.postcode ?? '', s.settings.servedPostcodes);
        const outOfArea = coverage.state !== 'inside';

        const id = `req_${s.data.requests.length}_${now.getTime().toString(36).slice(-4)}`;
        /* Same counter the wizard uses, so a phoned-in request and a
           self-service one are indistinguishable downstream — which is the
           point: the pipeline after intake must not care where it came from. */
        const reference = `A-${(2500 + s.data.requests.length).toString()}`;

        const request: ServiceRequest = {
          id,
          reference,
          customerId: input.customerId,
          propertyId: input.propertyId,
          serviceSlug: input.serviceSlug,
          addOnIds: input.addOnIds,
          windowCount: input.windowCount ?? undefined,
          furniturePieces: input.furniturePieces ?? undefined,
          preferred: input.preferred,
          photoIds: [],
          customerNote: input.customerNote?.trim() || undefined,
          internalNote: input.internalNote?.trim() || undefined,
          /*
           * `inReview` rather than `new`. "New" means nobody has looked at it;
           * the person who typed this one was on the phone with the customer
           * while doing so, and leaving it in the unread bucket would make the
           * response-time counter on screen 52 flag a request that was in fact
           * answered the moment it arrived.
           */
          status: input.asDraft ? 'draft' : 'inReview',
          outOfArea,
          createdAt: now.toISOString(),
          /* A draft has not been opened, because it has not arrived. Stamping
             it would start the response clock against a note to self. */
          openedAt: input.asDraft ? undefined : now.toISOString(),
          subscriptionIntent: input.subscriptionIntent ?? undefined,
        };

        set({ data: { ...s.data, requests: [request, ...s.data.requests] } });
        get().logChange({
          entity: 'request',
          entityId: id,
          summary: input.asDraft
            ? `Anfrage als Entwurf gespeichert: ${reference}`
            : `Anfrage telefonisch erfasst: ${reference}`,
        });
        return { id, reference, outOfArea };
      },

      updateRequest: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            requests: s.data.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          },
        })),

      submitRequestDraft: (id, now) => {
        const s = get();
        const request = s.data.requests.find((r) => r.id === id);
        if (!request || request.status !== 'draft') return;

        set({
          data: {
            ...s.data,
            requests: s.data.requests.map((r) =>
              r.id !== id
                ? r
                : {
                    ...r,
                    status: 'inReview' as const,
                    /* The clock starts here, not when the draft was opened.
                       Dating it from the draft would show a request that
                       breached the response window before anyone saw it. */
                    createdAt: now.toISOString(),
                    openedAt: now.toISOString(),
                  },
            ),
          },
        });
        get().logChange({
          entity: 'request',
          entityId: id,
          summary: `Entwurf zur Anfrage gemacht: ${request.reference}`,
        });
      },

      discardRequestDraft: (id) =>
        set((s) => {
          const request = s.data.requests.find((r) => r.id === id);
          /* Guarded rather than trusted: this deletes outright, and the only
             thing that makes that safe is that a draft has no quote, no
             booking and no invoice hanging off it. */
          if (!request || request.status !== 'draft') return {};
          return {
            data: { ...s.data, requests: s.data.requests.filter((r) => r.id !== id) },
          };
        }),

      /* -------------------------------------- ending a request or quote ---- */

      cancelRequest: (requestId, by, reason, now) =>
        set((s) => ({
          data: {
            ...s.data,
            requests: s.data.requests.map((r) =>
              r.id !== requestId
                ? r
                : {
                    ...r,
                    status:
                      by === 'customer'
                        ? ('cancelledByCustomer' as const)
                        : ('cancelledByCompany' as const),
                    respondedAt: now.toISOString(),
                    internalNote: [r.internalNote, reason].filter(Boolean).join('\n'),
                  },
            ),
            /*
             * A cancelled request must take its open quote with it. Leaving a
             * `sent` offer behind would keep it live on /konto/offerten and
             * still be signable — the customer would be booking a job they had
             * just called off.
             */
            offers: s.data.offers.map((o) =>
              o.requestId === requestId && (o.status === 'draft' || o.status === 'sent')
                ? { ...o, status: 'rejected' as const }
                : o,
            ),
          },
        })),

      declineOffer: (offerId, reason, now) =>
        set((s) => {
          const offer = s.data.offers.find((o) => o.id === offerId);
          if (!offer) return {};
          return {
            data: {
              ...s.data,
              offers: s.data.offers.map((o) =>
                o.id === offerId ? { ...o, status: 'rejected' as const } : o,
              ),
              /*
               * The request goes with it. §4.1 asks for a reason on the way
               * out in the other direction; the same courtesy applies here,
               * and the reason is the one thing that tells the owner whether
               * to follow up or let it go.
               */
              requests: s.data.requests.map((r) =>
                r.id !== offer.requestId
                  ? r
                  : {
                      ...r,
                      status: 'rejected' as const,
                      respondedAt: now.toISOString(),
                      internalNote: [r.internalNote, reason].filter(Boolean).join('\n'),
                    },
              ),
            },
            /* Whatever slot the customer was holding goes back to the calendar
               the moment they decline — otherwise it stays reserved for a job
               that will never happen until the 15-minute hold lapses. */
            holds: s.holds.filter((h) => h.offerId !== offerId),
          };
        }),

      /* ----------------------------------------------- quote building ---- */

      /**
       * §9.1 — the quote screen opens with lines already filled in. This is
       * that pre-fill, and it runs through the same buildOfferLines the
       * customer-facing quote uses, so the two can never disagree.
       */
      ensureDraftOffer: (requestId, now) => {
        const s = get();
        const existing = s.data.offers.find(
          (o) => o.requestId === requestId && o.status === 'draft',
        );
        if (existing) return existing.id;

        const request = s.data.requests.find((r) => r.id === requestId)!;
        const property = s.data.properties.find((p) => p.id === request.propertyId)!;
        const service = s.services.find((x) => x.slug === request.serviceSlug)!;
        const { lines, estimatedHours } = buildOfferLines({
          request,
          property,
          service,
          addOns: s.addOns,
          settings: s.settings,
        });

        const id = `off_${now.getTime().toString(36).toUpperCase().slice(-5)}`;
        const offer: Offer = {
          id,
          reference: `O-${request.reference.replace('A-', '')}-1`,
          requestId,
          version: 1,
          lines,
          // §17.2 — the quote opens with whatever screen 79 currently holds,
          // in the customer's language, falling back to German (§20.6).
          message:
            s.settings.messageTemplates['offer-sent'][
              s.data.customers.find((c) => c.id === request.customerId)?.language ?? 'de'
            ] ??
            s.settings.messageTemplates['offer-sent'].de ??
            DEFAULT_OFFER_MESSAGE,
          status: 'draft',
          estimatedHours,
        };

        set({
          data: {
            ...s.data,
            offers: [offer, ...s.data.offers],
            // Opening the builder counts as reading the request.
            requests: s.data.requests.map((r) =>
              r.id === requestId && r.status === 'new'
                ? { ...r, status: 'inReview' as const, openedAt: now.toISOString() }
                : r,
            ),
          },
        });

        return id;
      },

      updateOffer: (offerId, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) => (o.id === offerId ? { ...o, ...patch } : o)),
          },
        })),

      updateOfferLine: (offerId, lineId, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id !== offerId
                ? o
                : {
                    ...o,
                    lines: o.lines.map((line) =>
                      line.id !== lineId
                        ? line
                        : {
                            ...line,
                            ...patch,
                            // Editing the hours of an hourly line has to move
                            // the scheduled time with it, or the calendar and
                            // the invoice stop agreeing.
                            hours:
                              patch.hours ??
                              (line.calc === 'hourly' && patch.quantity !== undefined
                                ? patch.quantity
                                : line.hours),
                          },
                    ),
                  },
            ),
          },
        })),

      addOfferLine: (offerId) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id !== offerId
                ? o
                : {
                    ...o,
                    lines: [
                      ...o.lines,
                      {
                        /*
                         * Was `oli_new_${o.lines.length}`. Add a line, remove
                         * a different one, add again — same id. React saw a
                         * duplicate key, and updateOfferLine/removeOfferLine
                         * matched both rows, so editing one edited the other.
                         * The timestamp suffix is the pattern the key log
                         * already uses correctly.
                         */
                        id: `oli_${Date.now().toString(36)}_${o.lines.length}`,
                        label: '',
                        calc: 'hourly' as const,
                        quantity: 1,
                        unitPrice: s.settings.hourlyRate,
                        hours: 1,
                        optional: false,
                        selected: true,
                      },
                    ],
                  },
            ),
          },
        })),

      removeOfferLine: (offerId, lineId) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id !== offerId ? o : { ...o, lines: o.lines.filter((l) => l.id !== lineId) },
            ),
          },
        })),

      sendOffer: (offerId, now) =>
        set((s) => {
          const offer = s.data.offers.find((o) => o.id === offerId);
          if (!offer) return {};
          return {
            data: {
              ...s.data,
              offers: s.data.offers.map((o) =>
                o.id !== offerId
                  ? o
                  : {
                      ...o,
                      status: 'sent' as const,
                      issuedAt: now.toISOString(),
                      expiresAt: new Date(
                        now.getTime() + s.settings.offerValidityDays * 86_400_000,
                      ).toISOString(),
                    },
              ),
              requests: s.data.requests.map((r) =>
                r.id === offer.requestId
                  ? { ...r, status: 'offerSent' as const, respondedAt: now.toISOString() }
                  : r,
              ),
            },
          };
        }),

      // §4.1 — a decline sends a reason. Silence is the one answer that is
      // never acceptable.
      rejectRequest: (requestId, reason, now) =>
        set((s) => ({
          data: {
            ...s.data,
            requests: s.data.requests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    status: 'rejected' as const,
                    respondedAt: now.toISOString(),
                    internalNote: [r.internalNote, reason].filter(Boolean).join('\n'),
                  }
                : r,
            ),
          },
        })),

      /* -------------------------------------------- offer acceptance ---- */

      // §9.1 — switching an optional line off updates the total immediately,
      // and (via offerHours) genuinely shortens the visit. Price and duration
      // must move together or the scheduler books time nobody paid for.
      toggleOfferLine: (offerId, lineId) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((offer) =>
              offer.id !== offerId
                ? offer
                : {
                    ...offer,
                    lines: offer.lines.map((line) =>
                      line.id === lineId ? { ...line, selected: !line.selected } : line,
                    ),
                  },
            ),
          },
        })),

      holdOfferSlot: (offerId, slot, now) =>
        set((s) => ({
          // One hold per offer — re-picking replaces it rather than stacking.
          holds: [...s.holds.filter((h) => h.offerId !== offerId), createHold(offerId, slot, now)],
        })),

      signOffer: (offerId, now) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((offer) =>
              offer.id === offerId ? { ...offer, signedAt: now.toISOString() } : offer,
            ),
          },
        })),

      /**
       * §10 — payment in full on acceptance, then the slot becomes a booking.
       *
       * On failure the offer stays accepted-but-unpaid and the slot is NOT
       * booked (§20.2); the hold keeps running so the customer can retry
       * without losing the time they picked.
       */
      payOffer: (offerId, method, outcome, now) => {
        const s = get();
        const offer = s.data.offers.find((o) => o.id === offerId);
        const hold = s.holds.find((h) => h.offerId === offerId);
        if (!offer) return {};

        const stamp = now.getTime().toString(36).toUpperCase().slice(-4);
        const amount = offerTotal(offer);

        const payment: Payment = {
          id: `pay_${stamp}`,
          offerId,
          amount,
          method,
          at: now.toISOString(),
          status: outcome,
          gatewayRef: `mock_${stamp}`,
          failureReason: outcome === 'failed' ? 'card_declined' : undefined,
        };

        if (outcome === 'failed') {
          set({ data: { ...s.data, payments: [...s.data.payments, payment] } });
          return { failureReason: 'card_declined' };
        }

        const request = s.data.requests.find((r) => r.id === offer.requestId)!;
        const hours = offerHours(offer);
        const duration = Math.round(hours * 60);
        const reference = `B-${1050 + s.data.bookings.length}`;

        const booking: Booking = {
          id: `bkg_${stamp}`,
          reference,
          offerId,
          customerId: request.customerId,
          propertyId: request.propertyId,
          serviceSlug: request.serviceSlug,
          start: hold?.start ?? now.toISOString(),
          duration,
          arrivalWindow: arrivalWindowMinutes(hours),
          status: 'scheduled',
          photoIds: [],
          history: [
            { at: now.toISOString(), kind: 'created', label: 'Gebucht und bezahlt' },
          ],
        };

        set({
          data: {
            ...s.data,
            payments: [...s.data.payments, payment],
            bookings: [booking, ...s.data.bookings],
            offers: s.data.offers.map((o) =>
              o.id === offerId ? { ...o, status: 'accepted' as const } : o,
            ),
            requests: s.data.requests.map((r) =>
              r.id === offer.requestId ? { ...r, status: 'accepted' as const } : r,
            ),
          },
          // The hold has done its job; releasing it frees the slot record.
          holds: s.holds.filter((h) => h.offerId !== offerId),
        });

        return { bookingReference: reference };
      },

      // §20.1 — a negotiation produces a new version and voids the current one.
      requestOfferChange: (offerId, message) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id === offerId
                ? { ...o, status: 'revisionRequested' as const, message }
                : o,
            ),
            requests: s.data.requests.map((r) =>
              r.id === s.data.offers.find((o) => o.id === offerId)?.requestId
                ? { ...r, status: 'revisionRequested' as const }
                : r,
            ),
          },
          holds: s.holds.filter((h) => h.offerId !== offerId),
        })),

      // §20.1 — an expired quote can be reissued in one action.
      reissueOffer: (offerId, now) =>
        set((s) => ({
          data: {
            ...s.data,
            offers: s.data.offers.map((o) =>
              o.id === offerId
                ? {
                    ...o,
                    version: o.version + 1,
                    reference: o.reference.replace(/-\d+$/, `-${o.version + 1}`),
                    status: 'sent' as const,
                    issuedAt: now.toISOString(),
                    expiresAt: new Date(
                      now.getTime() + s.settings.offerValidityDays * 86_400_000,
                    ).toISOString(),
                    signedAt: undefined,
                  }
                : o,
            ),
          },
        })),

      /* ------------------------------------------------------- hiring */

      updateApplicationDraft: (patch) =>
        set((s) => ({
          applicationDraft: {
            ...s.applicationDraft,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        })),

      resetApplicationDraft: () => set({ applicationDraft: emptyApplicationDraft() }),

      submitApplication: (now) => {
        const s = get();
        const d = s.applicationDraft;
        // Continue the existing series rather than counting rows: deleting an
        // application (§14) must not hand its number to the next applicant.
        const highest = s.data.applications.reduce(
          (max, a) => Math.max(max, Number(a.reference.replace('BW-', '')) || 0),
          0,
        );
        const reference = `BW-${String(10_000 + highest + 1).slice(1)}`;

        const retain = new Date(now);
        retain.setMonth(retain.getMonth() + s.settings.applicationRetentionMonths);

        const application: Application = {
          id: `app_${now.getTime().toString(36).toUpperCase().slice(-5)}`,
          reference,
          postingId: d.postingId ?? undefined,
          spontaneous: d.postingId === null,
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          phone: d.phone,
          postcode: d.postcode,
          city: d.city,
          permit: d.permit ?? 'other',
          languages: d.languages,
          hasDrivingLicence: d.hasDrivingLicence,
          hasCar: d.hasCar,
          yearsExperience: d.yearsExperience ?? 0,
          experienceAreas: d.experienceAreas,
          availability: d.availability,
          startFrom: d.startFrom || undefined,
          references: d.references,
          documents: d.documents,
          motivation: d.motivation || undefined,
          status: 'new',
          submittedAt: now.toISOString(),
          // §14 — the retention window is recorded at submission, from the
          // value that was in force then. Changing the setting later must not
          // silently extend how long an existing record is kept.
          retainUntil: retain.toISOString(),
          consentGivenAt: now.toISOString(),
        };

        set({
          data: { ...s.data, applications: [application, ...s.data.applications] },
          applicationDraft: emptyApplicationDraft(),
        });

        return { reference };
      },

      updateApplication: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            applications: s.data.applications.map((a) =>
              a.id === id ? { ...a, ...patch } : a,
            ),
          },
        })),

      setApplicationStatus: (id, status) => get().updateApplication(id, { status }),

      rejectApplication: (id, reason) =>
        get().updateApplication(id, { status: 'rejected', rejectionReason: reason }),

      deleteApplication: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            applications: s.data.applications.filter((a) => a.id !== id),
          },
        })),

      /**
       * The bridge from applicant to contractor.
       *
       * The new member starts with the regions the applicant lives near and no
       * skills beyond cleaning — a furniture assembler is granted assembly
       * explicitly, because the field screens read `skills` to decide which
       * jobs a person may open.
       */
      convertApplicant: (id, now) => {
        const s = get();
        const app = s.data.applications.find((a) => a.id === id)!;
        if (app.convertedTeamMemberId) return app.convertedTeamMemberId;

        const memberId = `tm_${now.getTime().toString(36).toUpperCase().slice(-5)}`;
        const member: TeamMember = {
          id: memberId,
          firstName: app.firstName,
          lastName: app.lastName,
          email: `${app.firstName.toLowerCase()}.${app.lastName.toLowerCase()}@homivaro.ch`,
          phone: app.phone,
          role: 'contractor',
          active: true,
          regions: s.settings.servedPostcodes,
          skills: app.experienceAreas.includes('assembly')
            ? ['moebelmontage']
            : ['unterhaltsreinigung', 'einmalreinigung'],
          startedAt: now.toISOString(),
          fromApplicationId: app.id,
        };

        set({
          data: {
            ...s.data,
            team: [...s.data.team, member],
            applications: s.data.applications.map((a) =>
              a.id === id
                ? { ...a, status: 'accepted' as const, convertedTeamMemberId: memberId }
                : a,
            ),
          },
        });

        return memberId;
      },

      createPosting: (now) => {
        const s = get();
        const stamp = now.getTime().toString(36);
        const slug = `neue-stelle-${stamp.slice(-4)}`;
        /* Unpublished, and deliberately titled rather than blank: a row with
           no title in a list is indistinguishable from a rendering fault. */
        const blank = { de: '', en: '', fr: '', it: '' };
        const blankList = { de: [], en: [], fr: [], it: [] };

        const posting: JobPosting = {
          id: `job_${stamp}`,
          slug,
          title: { ...blank, de: 'Neue Stelle', en: 'New role' },
          kind: 'part-time',
          workload: [40, 80],
          regions: [],
          summary: { ...blank },
          responsibilities: { ...blankList },
          requirements: { ...blankList },
          offer: { ...blankList },
          published: false,
          createdAt: now.toISOString(),
        };

        set({ data: { ...s.data, postings: [posting, ...s.data.postings] } });
        get().logChange({
          entity: 'posting',
          entityId: posting.id,
          summary: 'Stelle angelegt',
        });
        return { id: posting.id, slug };
      },

      updatePosting: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            postings: s.data.postings.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        })),

      updateTeamMember: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            team: s.data.team.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          },
        })),

      /**
       * Switching role also picks somebody to *be* — see `repoint`. The field
       * screens read `currentMemberId`, and leaving it on the owner would show
       * the owner's whole day through a contractor's permissions.
       */
      /**
       * §17 — every price, rule and catalogue edit lands here.
       *
       * `coalesce` exists because the settings and catalogue screens autosave
       * on every keystroke. Without it, changing "25" to "30" writes three
       * entries (2, 3, 30) and the log becomes unreadable — which is worse
       * than the empty log it replaced. Same record, same actor, inside two
       * minutes: the entry is rewritten rather than stacked.
       */
      logChange: ({ entity, entityId, summary, actor, coalesce }) =>
        set((s) => {
          const now = effectiveNow(s.demo.dateOverride);
          const member = s.data.team.find((m) => m.id === s.demo.currentMemberId);
          const who =
            actor ?? (member ? `${member.firstName} ${member.lastName}` : 'System');

          const entry = {
            id: `chg_${now.getTime().toString(36)}_${s.data.changeLog.length}`,
            at: now.toISOString(),
            actor: who,
            entity,
            entityId,
            summary,
          };

          const head = s.data.changeLog[0];
          const mergeable =
            coalesce &&
            head &&
            head.entity === entity &&
            head.entityId === entityId &&
            head.actor === who &&
            now.getTime() - new Date(head.at).getTime() < 120_000;

          return {
            data: {
              ...s.data,
              changeLog: mergeable
                ? [{ ...entry, id: head.id }, ...s.data.changeLog.slice(1)]
                : [entry, ...s.data.changeLog],
            },
          };
        }),

      /**
       * §10 — the invoice a completed job produces.
       *
       * There was no create path at all: the screens could send, cancel and
       * read an invoice, but the only invoices that ever existed were the two
       * in the seed. Lines come from the accepted quote, so what the customer
       * agreed to and what they are billed cannot silently diverge.
       */
      createInvoiceForBooking: (bookingId, now) => {
        const s = get();
        const booking = s.data.bookings.find((b) => b.id === bookingId);
        if (!booking) return null;

        const existing = s.data.invoices.find((i) => i.bookingId === bookingId);
        if (existing) return existing.id;

        const offer = s.data.offers.find((o) => o.id === booking.offerId);
        const lines: InvoiceLine[] = (offer?.lines ?? [])
          .filter((line) => line.selected)
          .map((line) => ({
            /* The owner's wording for this quote if they gave one, otherwise
               the catalogue slug — which the draft editor can then fix. The
               store has no locale, so resolving the catalogue name belongs on
               the screen, not here. */
            label: line.displayLabel?.trim() || line.label,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          }));

        const stamp = now.getTime().toString(36).toUpperCase().slice(-4);
        const seq = 52 + s.data.invoices.length;
        const due = new Date(now);
        due.setDate(due.getDate() + INVOICE_TERM_DAYS);

        const invoice: Invoice = {
          id: `inv_${stamp}`,
          reference: `RE-${now.getFullYear()}-${String(seq).padStart(4, '0')}`,
          customerId: booking.customerId,
          bookingId,
          lines:
            lines.length > 0
              ? lines
              : [{ label: booking.serviceSlug, quantity: 1, unitPrice: 0 }],
          /* Draft, not sent. §10: the owner approves before it goes out. */
          status: 'draft',
          issuedAt: now.toISOString(),
          dueAt: due.toISOString(),
          qrReference: buildQrReference(seq),
        };

        set({
          data: {
            ...s.data,
            invoices: [invoice, ...s.data.invoices],
            bookings: s.data.bookings.map((b) =>
              b.id !== bookingId ? b : { ...b, status: 'invoiced' as const },
            ),
          },
        });
        get().logChange({
          entity: 'invoice',
          entityId: invoice.id,
          summary: `Rechnung ${invoice.reference} erstellt`,
        });
        return invoice.id;
      },

      updateInvoice: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          },
        })),

      updateInvoiceLine: (id, index, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((invoice) =>
              invoice.id !== id
                ? invoice
                : {
                    ...invoice,
                    lines: invoice.lines.map((line, i) =>
                      i === index ? { ...line, ...patch } : line,
                    ),
                  },
            ),
          },
        })),

      addInvoiceLine: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((invoice) =>
              invoice.id !== id
                ? invoice
                : {
                    ...invoice,
                    lines: [
                      ...invoice.lines,
                      { label: '', quantity: 1, unitPrice: s.settings.hourlyRate },
                    ],
                  },
            ),
          },
        })),

      removeInvoiceLine: (id, index) =>
        set((s) => ({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((invoice) =>
              invoice.id !== id
                ? invoice
                : { ...invoice, lines: invoice.lines.filter((_, i) => i !== index) },
            ),
          },
        })),

      sendInvoice: (id, now) => {
        const s = get();
        const invoice = s.data.invoices.find((i) => i.id === id);
        if (!invoice || invoice.status !== 'draft') return;

        const due = new Date(now);
        due.setDate(due.getDate() + INVOICE_TERM_DAYS);

        set({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((i) =>
              i.id !== id
                ? i
                : {
                    ...i,
                    status: 'sent' as const,
                    issuedAt: now.toISOString(),
                    dueAt: due.toISOString(),
                  },
            ),
          },
        });
        get().logChange({
          entity: 'invoice',
          entityId: id,
          summary: `Rechnung ${invoice.reference} versendet`,
        });
      },

      /** §10 — there was no path to 'paid' anywhere in the app. */
      markInvoicePaid: (id, now) => {
        const s = get();
        const invoice = s.data.invoices.find((i) => i.id === id);
        if (!invoice || invoice.status === 'paid' || invoice.status === 'cancelled') return;

        set({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((i) =>
              i.id !== id
                ? i
                : { ...i, status: 'paid' as const, paidAt: now.toISOString() },
            ),
            bookings: s.data.bookings.map((b) =>
              b.id !== invoice.bookingId ? b : { ...b, status: 'closed' as const },
            ),
          },
        });
        get().logChange({
          entity: 'invoice',
          entityId: id,
          summary: `Rechnung ${invoice.reference} als bezahlt markiert`,
        });
      },

      cancelInvoice: (id, cancelReason) => {
        const s = get();
        const invoice = s.data.invoices.find((i) => i.id === id);
        if (!invoice) return;

        set({
          data: {
            ...s.data,
            invoices: s.data.invoices.map((i) =>
              i.id !== id ? i : { ...i, status: 'cancelled' as const, cancelReason },
            ),
          },
        });
        get().logChange({
          entity: 'invoice',
          entityId: id,
          summary: `Rechnung ${invoice.reference} storniert — ${cancelReason}`,
        });
      },

      /**
       * §4.2 — the before/after pair is the evidence behind the handover
       * guarantee, which is why check-out refuses to complete without three
       * photos. It then discarded them, so the guarantee had nothing behind
       * it and the customer's own before/after screen could never fill.
       *
       * Photos are written as real Photo records carrying both the booking and
       * the property, which is what makes them findable from the account side.
       * They stay internal until someone consents to publishing (§20.6).
       */
      recordCheck: (bookingId, { kind, photos, note, extraHours }, now) =>
        set((s) => {
          const booking = s.data.bookings.find((b) => b.id === bookingId);
          if (!booking) return s;

          const stamp = now.getTime().toString(36);
          const records = photos.map((src, i) => ({
            id: `pho_${stamp}_${i}`,
            src,
            source: 'field' as const,
            kind: kind === 'in' ? ('before' as const) : ('after' as const),
            visibleToCustomer: true,
            publishConsent: false,
            bookingId,
            propertyId: booking.propertyId,
            takenAt: now.toISOString(),
          }));

          const parts = [
            kind === 'in' ? 'Eingecheckt' : 'Ausgecheckt',
            photos.length > 0 ? `${photos.length} Fotos` : null,
            extraHours ? `+${extraHours} Std. gemeldet` : null,
            note.trim() || null,
          ].filter(Boolean);

          return {
            data: {
              ...s.data,
              photos: [...s.data.photos, ...records],
              bookings: s.data.bookings.map((b) =>
                b.id !== bookingId
                  ? b
                  : {
                      ...b,
                      ...(kind === 'in'
                        ? { checkInAt: now.toISOString(), status: 'inProgress' as const }
                        : {
                            checkOutAt: now.toISOString(),
                            status: 'awaitingApproval' as const,
                          }),
                      photoIds: [...b.photoIds, ...records.map((p) => p.id)],
                      /* Without this the panel's booking detail showed nothing
                         at all for either end of the job. */
                      history: [
                        ...b.history,
                        {
                          at: now.toISOString(),
                          kind: kind === 'in' ? ('checkIn' as const) : ('checkOut' as const),
                          label: parts.join(' · '),
                        },
                      ],
                    },
              ),
            },
          };
        }),

      addPaymentMethod: ({ customerId, kind, label }, now) =>
        set((s) => {
          const mine = s.data.paymentMethods.filter((m) => m.customerId === customerId);
          return {
            data: {
              ...s.data,
              paymentMethods: [
                ...s.data.paymentMethods,
                {
                  id: `pm_${now.getTime().toString(36)}_${s.data.paymentMethods.length}`,
                  customerId,
                  kind,
                  label,
                  /* The first one saved is the default — otherwise the
                     customer ends up with a method and nothing marked. */
                  isDefault: mine.length === 0,
                  addedAt: now.toISOString(),
                },
              ],
            },
          };
        }),

      removePaymentMethod: (id) =>
        set((s) => {
          const removed = s.data.paymentMethods.find((m) => m.id === id);
          const rest = s.data.paymentMethods.filter((m) => m.id !== id);
          /* Removing the default promotes the next one rather than leaving the
             customer with methods on file and no default among them. */
          const orphaned =
            removed?.isDefault &&
            !rest.some((m) => m.customerId === removed.customerId && m.isDefault);
          const heir = orphaned
            ? rest.find((m) => m.customerId === removed.customerId)
            : undefined;

          return {
            data: {
              ...s.data,
              paymentMethods: rest.map((m) =>
                heir && m.id === heir.id ? { ...m, isDefault: true } : m,
              ),
            },
          };
        }),

      setDefaultPaymentMethod: (id) =>
        set((s) => {
          const target = s.data.paymentMethods.find((m) => m.id === id);
          if (!target) return s;
          return {
            data: {
              ...s.data,
              paymentMethods: s.data.paymentMethods.map((m) =>
                m.customerId !== target.customerId
                  ? m
                  : { ...m, isDefault: m.id === id },
              ),
            },
          };
        }),

      resumeSubscription: (id) =>
        set((s) => ({
          data: {
            ...s.data,
            subscriptions: s.data.subscriptions.map((sub) =>
              sub.id === id ? { ...sub, status: 'active' as const } : sub,
            ),
          },
        })),

      /**
       * §11 — a free skip has to skip something.
       *
       * Both the customer screen and the panel only did
       * `skipsUsedThisMonth + 1`: the counter moved, the visit did not, and
       * the booking stayed in the calendar. So the team still turned up at a
       * job the customer believed they had skipped.
       */
      skipNextVisit: (id, now) =>
        set((s) => {
          const subscription = s.data.subscriptions.find((sub) => sub.id === id);
          if (!subscription) return s;

          const next = s.data.bookings
            .filter(
              (b) =>
                b.customerId === subscription.customerId &&
                b.propertyId === subscription.propertyId &&
                b.status === 'scheduled' &&
                new Date(b.start) > now,
            )
            .sort((a, b) => a.start.localeCompare(b.start))[0];

          return {
            data: {
              ...s.data,
              subscriptions: s.data.subscriptions.map((sub) =>
                sub.id !== id
                  ? sub
                  : { ...sub, skipsUsedThisMonth: sub.skipsUsedThisMonth + 1 },
              ),
              bookings: next
                ? s.data.bookings.map((b) =>
                    b.id !== next.id
                      ? b
                      : {
                          ...b,
                          status: 'cancelled' as const,
                          history: [
                            ...b.history,
                            {
                              at: now.toISOString(),
                              kind: 'skipped',
                              label: 'Abo-Termin übersprungen',
                            },
                          ],
                        },
                  )
                : s.data.bookings,
            },
          };
        }),

      /**
       * The customer wrote `cancellationRequestedAt` and nothing else, while
       * the panel gates its banner and its "settled" check on
       * `status === 'cancellationPending'`. A cancellation therefore never
       * reached the owner: the plan kept reading "active" and every admin
       * action stayed enabled. The panel's own cancel already set both — this
       * is that behaviour, in one place, for both ends.
       */
      requestCancellation: (id, now) =>
        set((s) => ({
          data: {
            ...s.data,
            subscriptions: s.data.subscriptions.map((sub) =>
              sub.id !== id
                ? sub
                : {
                    ...sub,
                    status: 'cancellationPending' as const,
                    cancellationRequestedAt: now.toISOString(),
                  },
            ),
          },
        })),

      submitReview: ({ bookingId, customerId, rating, text, publishConsent }, now) =>
        set((s) => ({
          data: {
            ...s.data,
            reviews: [
              ...s.data.reviews,
              {
                /* Was `rev_${reviews.length + 1}` — the same collision class as
                   the quote lines: delete one, add another, and two records
                   share an id. */
                id: `rev_${now.getTime().toString(36)}_${s.data.reviews.length}`,
                bookingId,
                customerId,
                rating,
                text,
                status: 'pending' as const,
                submittedAt: now.toISOString(),
                publishConsent,
              },
            ],
          },
        })),

      setReviewStatus: (id, status) =>
        set((s) => ({
          data: {
            ...s.data,
            reviews: s.data.reviews.map((r) => (r.id === id ? { ...r, status } : r)),
          },
        })),

      replyToReview: (id, ownerReply) =>
        set((s) => ({
          data: {
            ...s.data,
            reviews: s.data.reviews.map((r) => (r.id === id ? { ...r, ownerReply } : r)),
          },
        })),

      /**
       * §4.2 — the no-access fee "only stands if the wait actually happened",
       * and the screen asks for a photo to show it did. That flag was held in
       * local state and never persisted, so the one piece of evidence behind a
       * charge was gone the moment the screen unmounted.
       */
      recordNoAccess: (bookingId, { reason, note, photo }, now) =>
        set((s) => {
          const booking = s.data.bookings.find((b) => b.id === bookingId);
          if (!booking) return s;

          const stamp = now.getTime().toString(36);
          const evidence = photo
            ? [
                {
                  id: `pho_${stamp}_na`,
                  src: `pho_noaccess_${bookingId}`,
                  source: 'field' as const,
                  kind: 'issue' as const,
                  visibleToCustomer: true,
                  publishConsent: false,
                  note: reason,
                  bookingId,
                  propertyId: booking.propertyId,
                  takenAt: now.toISOString(),
                },
              ]
            : [];

          return {
            data: {
              ...s.data,
              photos: [...s.data.photos, ...evidence],
              bookings: s.data.bookings.map((b) =>
                b.id !== bookingId
                  ? b
                  : {
                      ...b,
                      status: 'noAccess' as const,
                      photoIds: [...b.photoIds, ...evidence.map((p) => p.id)],
                      history: [
                        ...b.history,
                        {
                          at: now.toISOString(),
                          kind: 'noAccess' as const,
                          label: [reason, note.trim() || null, photo ? 'Foto erfasst' : null]
                            .filter(Boolean)
                            .join(' — '),
                        },
                      ],
                    },
              ),
            },
          };
        }),

      /**
       * §14 — one writer for both ends of a thread.
       *
       * The customer could already send; nothing could read it back, because
       * no admin screen touched data.messages. A reply written here was
       * genuinely unanswerable.
       */
      sendMessage: ({ customerId, subject, body, from }, now) =>
        set((s) => {
          const message: CustomerMessage = {
            id: `msg_${now.getTime().toString(36)}_${s.data.messages.length}`,
            customerId,
            subject,
            from,
            body,
            at: now.toISOString(),
            /* A message the company sends starts unread for the customer; one
               the customer sends is, trivially, already read by them. */
            readByCustomer: from === 'customer',
          };
          return { data: { ...s.data, messages: [...s.data.messages, message] } };
        }),

      markThreadRead: (customerId, subject) =>
        set((s) => ({
          data: {
            ...s.data,
            messages: s.data.messages.map((m) =>
              m.customerId === customerId && m.subject === subject
                ? { ...m, readByCustomer: true }
                : m,
            ),
          },
        })),

      setRole: (role) => set((s) => ({ demo: repoint({ ...s.demo, role }, s.data) })),

      setScenario: (scenario) =>
        set((s) => {
          const data = buildScenario(scenario, effectiveNow(s.demo.dateOverride));
          return { demo: repoint(s.demo, data), data, holds: [] };
        }),

      setDateOverride: (dateOverride) =>
        set((s) => {
          // Seed data is written relative to "now", so moving the clock has to
          // rebuild it — otherwise today's jobs would sit in the past.
          const data = buildScenario(s.demo.scenario, effectiveNow(dateOverride));
          return {
            demo: { ...repoint(s.demo, data), dateOverride },
            data,
            holds: [],
          };
        }),

      setCurrentCustomer: (currentCustomerId) =>
        set((s) => ({ demo: { ...s.demo, currentCustomerId } })),

      /*
       * These three are the ones screen 83 exists to report on — prices,
       * rules and the catalogue. They log themselves rather than trusting
       * every call site to remember, and coalesce because all three screens
       * autosave per keystroke.
       */
      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        const keys = Object.keys(patch);
        get().logChange({
          entity: 'settings',
          entityId: keys[0] ?? 'settings',
          summary: `Einstellung geändert: ${keys.join(', ')}`,
          coalesce: true,
        });
      },

      setServices: (services) => {
        set({ services });
        get().logChange({
          entity: 'service',
          entityId: 'catalogue',
          summary: 'Leistungskatalog bearbeitet',
          coalesce: true,
        });
      },

      setAddOns: (addOns) => {
        set({ addOns });
        get().logChange({
          entity: 'addOn',
          entityId: 'addons',
          summary: 'Zusatzleistungen bearbeitet',
          coalesce: true,
        });
      },

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
          applicationDraft: emptyApplicationDraft(),
        }),
    }),
    {
      name: 'homivaro-prototype',
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: () => undefined as never,
      /**
       * Defensive rehydrate.
       *
       * Bumping SCHEMA_VERSION handles a *known* shape change, but relying on
       * remembering to bump it is how a reviewer's stale localStorage ends up
       * crashing a screen on `undefined.length`. Any collection missing from
       * the persisted blob is filled from the current defaults, so a new
       * entity can never take a page down.
       */
      merge: (persisted, current) => {
        const saved = persisted as Partial<StoreState> | undefined;
        if (!saved) return current;
        return {
          ...current,
          ...saved,
          data: { ...current.data, ...(saved.data ?? {}) },
          settings: { ...current.settings, ...(saved.settings ?? {}) },
          demo: { ...current.demo, ...(saved.demo ?? {}) },
          draft: { ...current.draft, ...(saved.draft ?? {}) },
          applicationDraft: {
            ...current.applicationDraft,
            ...(saved.applicationDraft ?? {}),
          },
        };
      },
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
