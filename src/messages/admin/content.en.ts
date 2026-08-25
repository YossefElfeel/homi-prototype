import type { adminContentDe } from './content.de';

export const adminContentEn: typeof adminContentDe = {
  services: {
    title: 'Services & pricing',
    lead: 'Active services are selectable in the request flow straight away. Drafts stay internal until you put them on sale.',
    search: 'Search services',
    searchPlaceholder: 'Name, slug or short description',
    colName: 'Service',
    colType: 'Type',
    colCalc: 'Billing',
    colBase: 'Rate',
    colMin: 'Minimum',
    colStatus: 'Status',
    colActivate: 'Activate',
    /* Not "i18n". The column was named by whoever writes the code — to
       everybody else it is not a word. It was also the one column header on
       this screen that was never a translation key at all. */
    colLanguages: 'Languages',
    filterStatus: 'Status',
    filterType: 'Type',
    filterAll: 'all',
    calcHourly: 'By the hour',
    calcPerUnit: 'By count',
    calcFlat: 'Flat rate',
    guarantee: 'With handover guarantee',
    translationGap: '{n} translations missing',

    createAction: 'Add a service',

    rowOpen: 'View details',
    rowEdit: 'Edit',
    rowCustomerView: 'View on the website',
    rowActivate: 'Activate',
    rowDeactivate: 'Deactivate',
    rowDelete: 'Delete',

    /* The title names the service, not the act — the act is already on the
       button. What a reader of the confirm needs first is which of the eight
       rows this is about. */
    activateTitle: 'Activate “{name}”?',
    activateBody:
      'It becomes a choice in the request flow at the rate you have set, which is the rate customers are then quoted. The marketing pages are generated from the catalogue at build time and follow on the next deploy.',
    activateConfirm: 'Activate',
    activateDone: '“{name}” is live.',

    deactivateTitle: 'Deactivate “{name}”?',
    deactivateBody:
      'It disappears from the request flow and nobody can ask for it any more. Jobs and invoices already raised are untouched — they have been agreed.',
    deactivateConfirm: 'Deactivate',
    deactivateDone: '“{name}” is disabled.',

    deleteTitle: 'Delete “{name}”?',
    deleteBody:
      'This is permanent. If you only want to stop offering it for now, deactivate instead — the service and its price stay.',
    deleteConfirm: 'Delete permanently',
    deleteDone: '“{name}” has been deleted.',
    /* States the number rather than just "cannot": a service with fourteen
       jobs behind it is a different case from one with a single job, and the
       owner decides between deactivating and finishing the work on that. */
    deleteBlockedTitle: '“{name}” cannot be deleted',
    deleteBlockedBody:
      '{n} requests, jobs or plans point at it. Remove the service and each of them holds a name nothing can resolve. Deactivating takes it off the market just as well and keeps the history readable.',
    deleteBlocked: 'This service is still in use.',

    detailsTitle: 'Service at a glance',
    detailsBack: 'All services',
    detailsLocaleHint:
      'German and English are maintained. French and Italian exist but are not translated — the website shows the German text there (§20.6).',
    detailsFallback: 'not translated — shows German',
    detailsUsageHint: 'What points at this service, and therefore what stands in the way of deleting it.',
    detailsUsageRequests: 'Requests',
    detailsUsageBookings: 'Jobs',
    detailsUsagePlans: 'Plans',
    detailsDangerTitle: 'Delete this service',
    detailsSlug: 'Slug (URL)',
    detailsNames: 'Name',
    detailsShort: 'Short description',
    detailsPricing: 'Billing',
    detailsProfile: 'Duration estimate',
    detailsGuarantee: 'Handover guarantee',
    detailsGuaranteeYes: 'Yes — a free re-clean if the inspection is not passed',
    detailsGuaranteeNo: 'No',
    detailsMissing: 'missing — the website shows German',
    detailsUsage: 'In use',
    detailsUsageBody: '{n} requests, jobs and plans point at it.',
    detailsUsageNone: 'Not used anywhere yet.',
    close: 'Close',

    filterEmptyTitle: 'No service matches',
    filterEmptyBody:
      'The search term and the filters together leave no rows. The catalogue itself is not empty.',
    filterReset: 'Clear the filters',
    emptyTitle: 'No services',
    emptyBody: 'Without a service nobody can send a request. Add at least one.',
  },

  service: {
    back: 'All services',
    nameTitle: 'Name',
    nameHint: 'Appears on the website and in the quote, in the customer’s language.',
    shortTitle: 'Short description',
    shortHint:
      'The line under the name on the service page and in the tile on the homepage.',
    pricingTitle: 'Price',
    pricingHint:
      'What it bills by decides what the rate means — per hour, per counted item, or once for the whole job.',
    calcLabel: 'Billing method',
    calcHourly: 'By the hour — rate × estimated duration',
    calcPerUnit: 'By count — counted items are converted into hours',
    calcFlat: 'Flat rate — one fixed price for the whole job',
    basePrice: 'Rate',
    basePriceHourly: 'Francs per hour.',
    basePricePerUnit: 'Francs per hour; the counted items produce the hours (§5.1).',
    basePriceFlat: 'Francs for the whole job, however long it takes.',
    minDuration: 'Minimum duration in hours',
    minDurationHint: 'The floor is 2 hours; this can only move it up.',
    slugLabel: 'Slug (URL)',
    slugHint: 'Derived from the German name and fixed after that — links to it should hold.',
    profileTitle: 'Duration estimate',
    profileHint:
      'Decides which column of the duration table the system proposes hours from.',
    profileStandard: 'Regular',
    profileDeep: 'Deep',
    profileMoveout: 'Move-out',
    profileOffice: 'Office',
    profileNone: 'None — by count',
    guaranteeLabel: 'Offer the handover guarantee',
    guaranteeHint: 'Commits to a free re-clean if the inspection is not passed.',
    statusTitle: 'Visibility',
    statusHint:
      'Only “Active” is offered to customers in the request flow, and only “Active” goes onto the marketing pages at the next build. Draft and Disabled are both invisible — the difference is whether the service has never been out yet or has been withdrawn.',
    statusPending: 'Pending change: {from} → {to}',
    statusApply: 'Apply the change',
    statusDiscard: 'Discard',
    missingTitle: 'Missing translations',
    missingBody:
      'Where a language is missing the website shows the German text. That is the intended fallback, but it is noticeable.',
    save: 'Save',
    saved: 'Saved',
  },

  serviceNew: {
    title: 'New service',
    lead: 'Nothing is written until you save below. Saved as a draft, the service stays internal until the price and the copy are settled.',
    back: 'All services',
    nameRequired: 'Without a German name there is neither a name nor a slug.',
    slugPreview: 'The URL will be /leistungen/{slug}',
    saveDraft: 'Save as a draft',
    saveActive: 'Create and activate',
    createNote:
      'A draft appears nowhere but here. Activating puts the service into the request flow at once.',
    createdDraft: '“{name}” saved as a draft.',
    createdActive: '“{name}” created and live.',
    activateTitle: 'Put “{name}” on sale straight away?',
    activateBody:
      'It becomes a choice in the request flow immediately — at the rate above. Saving it as a draft is the alternative, and you can activate it whenever you like afterwards.',
    activateConfirm: 'Create and activate',
    dismiss: 'Back',
  },

  addons: {
    title: 'Add-ons',
    /* Said "a price and a time cost", which assumes the reader already knows
       what an add-on is. The opening line has to name the thing, not list its
       two fields. */
    lead: 'An add-on is a line attached to a service — a fixed price on top of the job, plus the minutes it adds to the visit. The price is billed; the time is only scheduled.',


    search: 'Search add-ons',
    searchPlaceholder: 'Name, slug or short description',
    colName: 'Add-on',
    colPrice: 'Price',
    colDuration: 'Time',
    colServices: 'Applies to',
    colStatus: 'Status',
    colAvailable: 'Available',
    filterStatus: 'Status',
    filterService: 'Service',
    filterAll: 'all',

    createAction: 'Create an add-on',

    rowOpen: 'Open and edit',
    rowDelete: 'Delete',

    /* A switch can read "on" and the add-on still reach nobody — when not one
       of the services it hangs off is on sale. Without this note that is a
       green badge over a row no customer ever sees. */
    unreachable: 'reaches nobody',
    unreachableNone: 'Attached to no service — it appears in no request.',
    unreachableInactive:
      'Every service it is attached to is a draft or withdrawn — it appears in no request.',

    switchOn: 'Make «{name}» available',
    switchOff: 'Hide «{name}»',
    switchHint:
      'Takes effect at once. Available means it is offered in the «Extras» step. Hidden, it drops out of new requests — jobs already placed and quotes already sent are untouched.',
    switchedOn: '«{name}» is now offered in the request flow.',
    switchedOff: '«{name}» is hidden. Jobs already running are untouched.',

    deleteTitle: 'Delete «{name}»?',
    deleteBody:
      'This is final. To stop offering it for a while, hide it with the switch instead — the price, the copy and the service links all survive that.',
    deleteConfirm: 'Delete for good',
    deleteDone: '«{name}» has been deleted.',
    /* Says the number rather than just "no": an add-on on twelve quotes is a
       different case from one on a single quote, and that is what the owner
       decides on — hide it, or wait. */
    deleteBlockedTitle: '«{name}» cannot be deleted',
    deleteBlockedBody:
      '{n} requests and quotes point at it. A quote line remembers the slug, not the name — remove the record and an invoice already sent reads «{slug}» where «{name}» was. Hiding takes it off the menu just as well and leaves those documents readable.',
    deleteBlocked: 'This add-on is still in use.',

    filterEmptyTitle: 'No add-on matches',
    filterEmptyBody:
      'The search term and the filters together leave no row. The list itself is not empty.',
    filterReset: 'Clear filters',
    emptyTitle: 'No add-ons',
    emptyBody:
      'With none, the customer skips the «Extras» step — the request still works, there is simply nothing to buy alongside. Write the first one.',
  },

  addon: {
    back: 'All add-ons',
    nameTitle: 'Name',
    nameHint: 'The line the customer taps in the «Extras» step, in their own language.',
    shortTitle: 'Short description',
    shortHint:
      'The sentence underneath. It answers «what exactly do I get for that» — «Up to five windows including frames», not «Window cleaning».',
    pricingTitle: 'Price and time',
    pricingHint:
      'The two numbers mean different things: the price is billed once per job, the time cost only lengthens the appointment.',
    priceLabel: 'Price',
    priceHint:
      'Francs, once per job — independent of the area, the duration and the service’s hourly rate.',
    durationLabel: 'Time cost in hours',
    durationHint:
      'How much longer the visit runs. It feeds the schedule, not the bill — the price above already covers that time. Use 0 for something that costs no extra time.',
    servicesTitle: 'Applies to',
    servicesHint:
      'Which services it appears under in the «Extras» step. Without at least one it appears nowhere.',
    servicesRequired: 'With no service attached, nobody can pick this add-on.',
    servicesInactive: 'not on sale',
    availabilityTitle: 'Availability',
    availabilityLabel: 'Offer it in the request flow',
    availabilityHint:
      'Takes effect at once, and the same switch takes it back. Hidden, it drops out of new requests; jobs running and quotes sent stay exactly as they are.',
    slugLabel: 'Slug',
    slugHint:
      'Derived from the German name and fixed after that. Quote lines remember this slug — change it and every line already written loses its name.',
    usageTitle: 'Usage',
    usageHint: 'What points at it, and therefore stands in the way of deleting it.',
    usageRequests: 'Requests',
    usageOffers: 'Quotes and invoices',
    usageBody: '{n} requests and quotes point at it.',
    usageNone: 'Not used anywhere yet.',
    localeHint:
      'German is required. Where another language is missing, the request flow shows the German text (§20.6) — intended, but it shows.',
    dangerTitle: 'Delete add-on',
    save: 'Save changes',
    saved: '«{name}» saved.',
    unsaved: 'Unsaved changes. The switch above applies at once; the fields here wait for Save.',
    discard: 'Discard',
    notFound: 'This add-on no longer exists.',
  },

  addonNew: {
    title: 'New add-on',
    lead: 'Something a customer can buy alongside a service. Nothing is written until you save below.',
    back: 'All add-ons',
    nameRequired: 'Without a German name there is no name and no slug.',
    slugPreview: 'Slug will be: {slug}',
    saveHidden: 'Save without offering it',
    saveActive: 'Create and offer',
    createNote:
      'Hidden, it appears nowhere but this panel. Offering it puts it straight into the «Extras» step of the request flow that is running now.',
    createdHidden: '«{name}» created, not yet visible.',
    createdActive: '«{name}» created and visible in the request flow.',
    activateTitle: 'Offer «{name}» right away?',
    activateBody:
      'It goes into the «Extras» step immediately — at the price above, and a customer can add it to a job the same minute. Saving it hidden is fine too; offering it afterwards is one click.',
    activateConfirm: 'Create and offer',
    dismiss: 'Back',
  },

  coupons: {
    title: 'Coupons',
    lead: 'Discount codes, how long each one runs and how often it has been redeemed.',
    colCode: 'Code',
    colValue: 'Discount',
    colValidity: 'Valid',
    colUsage: 'Redeemed',
    colStatus: 'Status',
    newAction: 'Create a coupon',
    state: {
      active: 'Valid',
      expired: 'Expired',
      'used-up': 'Fully redeemed',
      inactive: 'Disabled',
    },
    stackingNote: 'A coupon and a plan discount never add up — the larger one applies.',
    emptyTitle: 'No coupons',
    emptyBody:
      'Deliberately empty. In this market discount messaging reads cheap rather than attractive — use it sparingly.',
  },

  coupon: {
    back: 'All coupons',
    newTitle: 'New coupon',
    codeLabel: 'Code',
    codeHint: 'Not case sensitive when entered.',
    kindLabel: 'Type',
    kindPercent: 'Percent',
    kindAmount: 'Amount',
    valueLabel: 'Value',
    minOrderLabel: 'Minimum order value',
    servicesLabel: 'Applies to',
    servicesAll: 'All services',
    validFrom: 'Valid from',
    validTo: 'Valid until',
    maxUsesLabel: 'Maximum redemptions',
    maxUsesHint: 'Leave blank for unlimited.',
    activeLabel: 'Active',
    save: 'Save',
  },

  reviews: {
    title: 'Reviews',
    lead: 'Every review is released by you before it appears on the website.',
    pendingTitle: 'Awaiting release',
    publishedTitle: 'Published',
    rejectedTitle: 'Not published',
    starsLabel: '{n} out of 5 stars',
    publish: 'Publish',
    reject: 'Do not publish',
    replyLabel: 'Your reply',
    replyHint: 'Appears under the review.',
    negativeTitle: 'Critical review',
    negativeBody:
      'This one is not published automatically. Reply first — an answered critical review does less damage than a deleted one.',
    emptyTitle: 'No reviews yet',
    emptyBody:
      'Customers are asked for a review once payment completes. Until then the website shows the promise instead of stars.',
    restore: 'Send back for review',
    restored: 'The review is awaiting release again.',
    unpublish: 'Take down',
    unpublished: 'The review is no longer public.',
    editReply: 'Edit the reply',
    published: 'Review published.',
    rejected: 'Review not published.',
    replySaved: 'Reply saved.',
    noConsentTitle: 'No consent given',
    noConsentBody:
      'This customer did not agree to publication. The review stays internal — that is not a judgement call (§20.6).',
    emptyAction: 'Go to jobs',
  },

  templates: {
    title: 'Message templates',
    lead: 'Every text we send — automatically, or picked by hand.',
    searchLabel: 'Search',
    searchPlaceholder: 'Subject, text or tag',
    filterFlow: 'Area',
    filterTag: 'Tag',
    filterAll: 'All',
    newAction: 'New template',
    colSubject: 'Subject',
    colFlow: 'Area',
    colChannels: 'Channels',
    colLanguages: 'Languages',
    complete: 'Complete',
    missing: '{n} missing',
    editAction: 'Edit',
    deleteAction: 'Delete',
    untitled: 'No subject',
    automatic: 'Automatic',
    automaticOn: 'Sends automatically on: {event}',
    manual: 'Manual only',
    standard: 'Default',
    makeStandard: 'Make default',
    standardDone: 'This template is what goes out automatically from now on.',
    count: '{n} of {total} templates',
    fallbackNote: 'Where a language is missing, the German text is sent.',
    channelEmail: 'Email',
    channelSms: 'SMS',
    smsWarning: 'Over {limit} characters — bills as two SMS.',
    placeholderNote: 'Placeholders in curly braces are replaced when the message is sent.',
    emptyForLocale: 'No text — the German version is sent instead.',
    emptyTitle: 'No template found',
    emptyBody:
      'The search or the filters rule out every template. Clear the filters, or create a new template.',
    emptyAction: 'Clear filters',

    deleteTitle: 'Delete this template?',
    deleteBody: 'The text is gone afterwards. This cannot be undone.',
    deleteConfirm: 'Delete for good',
    deleteCancel: 'Keep it',
    deleteReplaceTitle: 'Delete the default template?',
    deleteReplaceBody:
      'This is what goes out automatically on "{event}". Pick the template that takes over.',
    deleteReplaceLabel: 'Takes over from now on',
    deleteLastTitle: 'Delete the last template for "{event}"?',
    deleteLastBody:
      'No template would be left for this event. So that "{event}" keeps sending, we restore the original text — your edits to it are lost.',
    deleteLastConfirm: 'Delete and restore the original',
    deleteDone: 'Template deleted.',
    restoreDone: 'Template deleted — original text restored.',

    usageTitle: 'Used in',
    usageNote: 'This template is offered in the pickers on these screens.',
    usage: {
      messages: 'Messages',
      quote: 'Quotes',
      invoice: 'Invoices',
      booking: 'Jobs',
      review: 'Reviews',
      request: 'Requests',
    },

    flows: {
      requests: 'Requests',
      quotes: 'Quotes',
      bookings: 'Jobs',
      invoices: 'Invoices',
      reviews: 'Reviews',
      general: 'General',
    },

    events: {
      'request-received': 'Request received',
      'offer-sent': 'Quote sent',
      'offer-reminder': 'Quote about to expire',
      'booking-confirmed': 'Appointment confirmed',
      'appointment-reminder': 'Reminder 24 hours before',
      'on-the-way': 'On the way',
      'job-done': 'Job finished',
      'invoice-sent': 'Invoice sent',
      'payment-reminder': 'Payment reminder',
      cancellation: 'Cancellation',
      'review-request': 'Review request',
    },
  },

  template: {
    back: 'Back to templates',
    newTitle: 'New template',
    saveAction: 'Save',
    savedDone: 'Template saved.',
    createdDone: 'Template created.',

    flowLabel: 'Area',
    flowHint:
      'Decides which pickers offer this template — not just how the list is sorted.',
    eventLabel: 'Automatic event',
    eventNone: 'None — pick by hand only',
    eventHint:
      'With an event, this template can be sent automatically. Without one, it only appears in the pickers.',
    channelsLabel: 'Channels',
    tagsLabel: 'Tags',
    tagsHint: 'Separate with commas. They become filters on the overview.',
    subjectLabel: 'Subject',
    bodyLabel: 'Text',
    subjectMissing: 'Without a subject the template has no name in the picker.',

    placeholderTitle: 'Placeholders',
    placeholderNote:
      'Replaced with the real values on send. Anything we do not know keeps its braces and blocks direct sending.',
    placeholderInsert: 'Insert',

    requiredTitle: 'German text missing',
    requiredBody:
      'German is the fallback language (§20.6). With no German text this template has nothing to send in three of the four languages.',
  },

  templatePicker: {
    label: 'Template',
    placeholder: 'Choose a template …',
    empty: 'No template exists for this area yet.',
    manage: 'Manage templates',
    previewTitle: 'Preview',
    subjectLabel: 'Subject',
    sendDirect: 'Send as is',
    editFirst: 'Edit before sending',
    insertDone: 'Template inserted — check the text before sending.',
    sentDone: 'Message sent.',
    overwriteTitle: 'Replace the text you started?',
    overwrite: 'What you have written so far is overwritten by the template.',
    overwriteAction: 'Replace it',
    unresolvedTitle: 'Cannot send as is',
    unresolvedBody:
      'We have no value here for {fields}. The placeholder would reach the customer as it stands — fill it in before sending.',
    resolvedNote: 'Every placeholder is filled.',
  },


  settings: {
    title: 'Settings',
    lead: 'Prices, hours, regions and rules. Changes take effect at once — there is no save button.',
    tabRegions: 'Areas',
    tabHours: 'Hours',
    tabFees: 'Fees & rules',
    tabContract: 'Agreement',
    contractTitle: 'Signature on the quote',
    contractLead:
      'Every quote goes out signed — yours is applied when it is sent, the customer signs on accepting. This is what lands on the document.',
    signatureName: 'Name under the signature',
    signatureRole: 'Role',
    signatureRoleHint: 'Printed beside the name on the agreement.',
    signatureCurrent: 'Current signature',
    signatureRedraw: 'Sign again',
    signatureLabel: 'Sign here',
    signatureHint: 'With a mouse or a finger.',
    signatureClearLabel: 'Start again',
    signatureSave: 'Use this signature',
    signatureCancel: 'Cancel',
    signatureNote:
      'Applies to quotes sent from now on. Agreements already signed keep the signature they were closed with.',

    regionsTitle: 'Service area',
    regionsLead:
      'Postcodes counted as “inside”. Requests from outside are not blocked — they arrive flagged.',
    regionsColPostcode: 'Postcode',
    regionsColName: 'Municipality',
    regionsColStatus: 'Status',
    regionsIncluded: 'Inside',
    regionsExcluded: 'Outside',
    regionsZurichNote:
      'The city of Zurich is deliberately not included. The region pages and the search optimisation target these eight municipalities.',

    hoursTitle: 'Working hours',
    hoursDays: 'Working days',
    hoursFrom: 'From',
    hoursTo: 'To',
    hoursCapacity: 'Jobs per day',
    hoursCapacityHint:
      'The hardest limit in the whole system. The slot picker never offers more.',
    hoursLead: 'Minimum notice in hours',
    hoursLeadHint: 'No same-day bookings.',
    closuresTitle: 'Closure periods',
    closuresLead:
      'Holidays and public holidays. Plan visits inside these periods are moved automatically and the customer is told.',
    closuresFrom: 'From',
    closuresTo: 'To',
    closuresReason: 'Reason',
    closuresYearly: 'Yearly',
    closuresAdd: 'Add a closure period',
    closuresRemove: 'Remove',
    closuresEmpty: 'No closure periods recorded.',

    feesTitle: 'Surcharges',
    feeSaturday: 'Saturday surcharge',
    feeEvening: 'Late-afternoon surcharge',
    feeEveningFrom: 'Applies from',
    feeEveningNote:
      'The documents never define “evening” — the working day ends at 18:00. This value is the assumption we made.',
    feeTravel: 'Free travel up to',
    rulesTitle: 'Cancellation',
    ruleFreeUntil: 'Free until',
    ruleLate: 'Charged after that',
    ruleNoAccess: 'No access',
    subscriptionTitle: 'Plans',
    ruleCancellation: 'Cooling-off period',
    ruleCancellationHint:
      'How long after buying a plan it may still be cancelled and refunded — as long as no visit has happened.',
    days: 'Days',
    subscriptionMoved:
      'Term length and discount now live on the individual plan rather than here: two plans are allowed to differ on both. What stays here applies to all of them.',
    ruleSkips: 'Free skips per month',
    insuranceTitle: 'Business liability',
    insuranceLabel: 'A valid liability policy is in place',
    insuranceHint:
      'Enables permanent key holding and lets the website name the insurance.',
    months: 'months',
    hours: 'hours',
    save: 'Save',
    saved: 'Saved',
  },

  changelog: {
    title: 'Change log',
    lead: 'Who changed what, and when.',
    colWhen: 'When',
    colActor: 'Who',
    colEntity: 'What',
    colSummary: 'Change',
    emptyTitle: 'No entries yet',
    emptyBody: 'Every change to prices, settings and jobs is recorded here.',
  },

  search: {
    title: 'Search',
    placeholder: 'Customer, reference, address or invoice number',
    lead: 'One search across customers, requests, quotes, invoices and properties.',
    groupCustomers: 'Customers',
    groupRequests: 'Requests',
    groupOffers: 'Quotes',
    groupInvoices: 'Invoices',
    groupProperties: 'Properties',
    resultCount: '{n} results',
    idleTitle: 'What are you looking for?',
    idleBody: 'A name, a reference, a street or an invoice number is enough.',
    emptyTitle: 'No matches',
    emptyBody: 'Nothing found for “{query}”.',
  },
};
