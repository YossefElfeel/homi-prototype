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
    countBlockedTitle: '«{name}» has no question yet',
    countBlockedBody:
      'The service bills by count, but nothing says what is being counted. Published, the request flow would show an unlabelled number box. Write the question under «Counted unit» and it can go on sale.',
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
    countTitle: 'Counted unit',
    countCardHint:
      'What the request flow asks when this service bills by count. Without it the flow shows a number box with no question over it.',
    countLabelField: 'The question',
    countLabelHint: 'For example «How many window sashes?». Sits above the number box.',
    countHintField: 'The line underneath',
    countHintHint: 'Where the business says what counts as one unit — the sentence that stops the argument at the door.',
    countNounField: 'The unit, plural',
    countNounHint: 'Printed on the summary, on the request and on the quote. «18» on its own answers nothing.',
    countMissing:
      'Without a question this service cannot be requested: the flow would show an unlabelled number box. Until it is written the service stays a draft.',
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
    slugPreview: 'The URL will be /services/{slug}',
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
    colServices: 'Applies to',
    colActive: 'Switched on',
    servicesAll: 'All services',
    maxDiscountShort: 'max. {amount}',
    newAction: 'Create a coupon',
    rowOpen: 'Open coupon',
    search: 'Search coupons',
    searchPlaceholder: 'Code or service',
    filterState: 'State',
    filterAll: 'all',
    filterEmptyTitle: 'No coupon matches',
    filterEmptyBody:
      'Nothing here answers the search or the state you picked. Codes that have run out stay on the list — try clearing the filter before writing a new one.',
    filterReset: 'Clear filter',
    switchHint: 'Switches the code on or off straight away.',
    switchOn: 'Switch on {code}',
    switchOff: 'Switch off {code}',
    switchedOn: '{code} is switched on.',
    switchedOff: '{code} is switched off. Nobody can redeem it now.',
    stackingNote: 'A coupon and a plan discount never add up — the larger one applies.',
    emptyTitle: 'No coupons',
    emptyBody:
      'Nobody has written one yet. Worth keeping that way for a while: in this market discount messaging reads cheap rather than attractive, so a code works best aimed at one campaign rather than left running.',
  },

  coupon: {
    back: 'All coupons',
    newTitle: 'New coupon',
    newLead: 'Nothing is saved until you press save.',
    notFoundTitle: 'This coupon no longer exists',
    notFoundBody:
      'It was deleted, or the link is from an older version of the demo data. The list shows every coupon that exists now.',
    codeTaken: 'Another coupon already uses this code.',
    datesBackwards: 'The end date is before the start date.',
    maxUsesRemaining: '{n} redemptions left of the current ceiling.',
    usageCapped: 'Redeemed {used} of {max} times.',
    usageUncapped: 'Redeemed {used} times. No ceiling.',
    unsaved: 'These changes are not saved yet.',
    discard: 'Discard changes',
    cancel: 'Cancel',
    created: 'Coupon {code} created.',
    saved: 'Coupon {code} saved.',
    sectionCodeTitle: 'Code and discount',
    sectionDatesTitle: 'Dates and limits',
    sectionStatusTitle: 'Status',
    codeLabel: 'Code',
    codeHint: 'Not case sensitive when entered.',
    kindLabel: 'Type',
    kindPercent: 'Percent',
    kindAmount: 'Fixed',
    valueLabel: 'Value',
    minOrderLabel: 'Minimum order value',
    /* «Maximum discount», not «cap» — that word is already on the redemption
       ceiling below it, and two fields sharing a name on one screen are two
       fields that get confused. */
    maxDiscountLabel: 'Maximum discount CHF',
    maxDiscountHint: 'Leave empty for no ceiling.',
    maxDiscountFrom: 'Bites from an order value of {amount}.',
    maxDiscountZero: 'A maximum of 0 is a code that takes nothing off. Clear the field for no ceiling.',
    servicesLabel: 'Applies to',
    servicesAll: 'All services',
    validFrom: 'Created at',
    validTo: 'Valid until',
    maxUsesLabel: 'Maximum redemptions',
    maxUsesHint: 'Leave blank for unlimited.',
    activeLabel: 'Active',
    activeHint: 'Switched off, the code cannot be redeemed. The switch only takes effect when you save.',
    save: 'Save',
  },

  gallery: {
    title: 'Our work',
    lead: 'Which before/after pairs appear on /referenzen. A pair is one job — release always covers both halves.',

    consentTitle: 'Photos are internal until somebody agrees',
    consentBody:
      'Releasing here means the customer\u2019s written consent exists. The switch records that — it does not replace it.',

    tabReleased: 'On the website',
    tabWaiting: 'Not released',
    tabUnpairable: 'No pair',

    before: 'Before',
    after: 'After',
    unknownCustomer: 'No customer linked',
    unknownService: 'No service',

    addAction: 'Add a reference',
    addTitle: 'Add a reference',
    addBody:
      'Photos otherwise come from the crew through the job screens. This adds a piece of work by hand — for pictures that arrived by mail or sit on somebody’s phone.',
    addBooking: 'Which job is this from?',
    addBookingHint:
      'Only finished jobs without a reference. The job supplies the service and the date — without one it would be a stock photo.',
    addBookingPlaceholder: 'Choose a job',
    addNote: 'Note',
    addNoteHint: 'Optional. Shown under the pair, internal only.',
    addSameImage: 'Before and after cannot be the same picture.',
    addConsentNote:
      'Created as a draft and not shown on the website. Releasing it is a separate step with its own confirmation.',
    addNoCandidates:
      'Every finished job already has a reference. New jobs appear here once they are done.',
    addDone: 'Reference created — not released yet.',

    remove: 'Remove',
    removeTitle: 'Remove this reference?',
    removeBody:
      'Both pictures are deleted. This only covers references created in the office — crew photos belong to the job record and stay.',
    removeDone: 'Reference removed.',

    release: 'Release',
    withdraw: 'Withdraw',
    viewOnSite: 'View on the website',
    openCustomer: 'Open the customer record',

    releaseTitle: 'Put this on the website?',
    releaseBody:
      'Both pictures from this job appear under /referenzen. This requires written consent from {name} — releasing confirms that it exists.',
    withdrawTitle: 'Take this off the website?',
    withdrawBody:
      'The pair leaves the gallery at once. The pictures stay on the job and can be released again at any time.',
    releaseDone: 'The job is in the gallery.',
    withdrawDone: 'The job is no longer public.',

    reason: {
      context: 'Context shot',
      noPartner: 'Missing counterpart',
    },
    reasonBody: {
      context:
        'Taken by the crew to record something — a locked door, a damage. Never meant for the website.',
      noPartner:
        'Only one half exists. A gallery entry needs a before and an after from the same job.',
    },

    emptyTitle: 'No photos yet',
    emptyBody:
      'As soon as the crew takes before/after pictures on a job, they wait here for release.',
    releasedEmptyTitle: 'Nothing released yet',
    releasedEmptyBody:
      'There is currently nothing on /referenzen. The «Not released» tab shows what is ready.',
    waitingEmptyTitle: 'Nothing open',
    waitingEmptyBody: 'Every pair has been decided. New jobs land here.',
    looseEmptyTitle: 'Everything pairs up',
    looseEmptyBody: 'Every photo belongs to a before/after pair.',
  },
  imagePicker: {
    fromDevice: 'Choose from your computer',
    fromDeviceHint:
      'Scaled to 1600 px on upload and kept in this browser — there is no server here that could hold it otherwise.',
    uploading: 'Processing …',
    uploadFailed: 'The picture could not be saved. Try another one.',
    notAnImage: 'That is not an image file.',
    fromThisDevice: 'Uploaded from this device',
    orFromProject: 'Or one from the project',
    fromUrl: 'Paste an address from the web instead',
    urlLabel: 'Image address',
    urlHint:
      'The full address, with https. Images from elsewhere are embedded as they are — without the size optimisation files in the project get.',
  },
  construction: {
    title: 'Construction — portfolio',
    lead: 'Which pictures stand on /construction, in which group and in which order. Unlike the customer gallery there is no consent attached here: these are our own photographs of our own work.',
    viewPage: 'View the page',

    sectionEdit: 'Edit section',
    sectionHeadings: 'Headings for this section',
    sectionHeadingsHint:
      'The arrows on the right set the order on the page. German is enough — the other languages fall back to it (§20.6).',
    sectionTitle: 'Heading',
    sectionTitleHint: 'For the directions that set one colour.',
    sectionLead: 'Display heading — dark',
    sectionLeadHint: 'The first part, in navy.',
    sectionAccent: 'Display heading — red',
    sectionAccentHint: 'The second part. Leave empty for a single-colour line.',
    sectionBody: 'Text under the heading',
    sectionBodyHint: 'One paragraph. Sits between the heading and the pictures.',
    sectionUp: 'Move section earlier',
    sectionDown: 'Move section later',

    sectionNew: 'New section',
    sectionNewTitle: 'Create a section',
    sectionNewBody:
      'A section is a heading with pictures under it. It appears on /construction as soon as the first picture is in it.',
    sectionNewHint: 'In German. The display heading and the paragraph come straight afterwards.',
    sectionDuplicate: 'A section with this title already exists — two tabs with the same name cannot be told apart.',
    sectionAdd: 'Create section',
    sectionAddDone: 'Section created — its headings are open.',

    sectionRemove: 'Delete section',
    sectionBlocked:
      'This section still holds {n} pictures. Move them to another section first — deleting a heading is a labelling decision, deleting the work under it is not.',
    sectionRemoveDone: 'Section deleted.',

    hiddenCount: '{n} hidden',

    visible: 'Shown',
    hidden: 'Hidden',
    moveUp: 'Move earlier',
    moveDown: 'Move later',
    edit: 'Caption',
    doneEditing: 'Done',
    groupField: 'Group',
    noAlt: 'No caption',

    addAction: 'Add a picture',
    addTitle: 'Add a picture',
    addBody: 'Goes into «{group}», at the end.',
    addFile: 'File',
    addFileHint: 'Files not used anywhere yet — or an address from the web. There is no upload in this prototype.',
    addFilePlaceholder: 'Choose a file',
    addNoFiles: 'Every available file is already assigned to a group.',
    addAlt: 'Caption',
    addAltHint: 'What is in the picture. German is enough — the other languages fall back to it (§20.6).',
    addDone: 'Picture added.',

    remove: 'Remove',
    removeTitle: 'Remove this picture?',
    removeBody:
      'It leaves the group. The file stays in the project and can be added again at any time — if it should only go temporarily, «Hide» is the shorter route.',
    removeDone: 'Picture removed.',

    emptyTitle: 'No pictures in this group',
    emptyBody:
      'The group only appears on /construction once it has a picture — a heading with nothing under it reads as a failed load.',
  },
  reviews: {
    title: 'Reviews',
    lead: 'Every review is released by you before it appears on the website.',
    search: 'Search',
    searchPlaceholder: 'Text, reply or name',
    filterEmptyTitle: 'No review matches',
    filterEmptyBody:
      'Nothing survives this search and this state. The reviews are there — just not these.',
    filterReset: 'Clear the filters',
    starsLabel: '{n} out of 5 stars',
    publish: 'Publish',
    republish: 'Publish again',
    reject: 'Do not publish',
    negativeTitle: 'Critical review',
    negativeBody:
      'This review is not published automatically. Call them first — an answered critical review does less damage than a deleted one, and that conversation no longer happens on this screen.',
    emptyTitle: 'No reviews yet',
    emptyBody:
      'Customers are asked for a review once payment completes. Until then the website shows the promise instead of stars.',
    restore: 'Send back for review',
    restored: 'The review is awaiting release again.',
    hide: 'Hide',
    hiddenDone: 'The review is no longer on the website.',
    published: 'Review published.',
    rejected: 'Review not published.',
    tabDeleted: 'Deleted',

    restoreFromBin: 'Restore',
    restoreDone: 'The review from {name} is back.',
    erase: 'Erase for good',
    eraseConfirmTitle: 'Erase for good — with no way back?',
    eraseConfirmBody:
      'This is the case §20.6 requires this button for: the person who wrote it has withdrawn their consent. The text and the reply are deleted and cannot be recovered. The change log keeps the fact that it was erased, never what it said.',
    eraseDone: 'Review erased for good.',
    deletedNote: 'Deleted on {date}',

    delete: 'Delete',
    deleteConfirmTitle: 'Delete this review?',
    deleteConfirmBody:
      'The review from {name} ({stars} stars) leaves the website at once and moves to the «Deleted» tab. It can be brought back from there.',
    deleteInstead:
      'If it should only go temporarily, «Hide» does the same without taking it out of the working list.',
    deleteDone: 'The review by {name} has been deleted.',
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
    usageNote: 'Where this text actually goes out.',
    usageChannels: 'Sent as',
    usageNoChannels:
      'No channel selected — this template cannot be sent anywhere.',
    usageScreens: 'Pickers',
    usageNoScreens:
      'No picker offers this area — this template only goes out automatically.',
    usageUnused:
      'Nothing sends this template: no automatic event, and no picker offers this area.',
    usage: {
      quote: 'Quotes',
      invoice: 'Invoices',
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
    sectionSetupTitle: 'Where it belongs',
    sectionSetupHint: 'Decides where the template shows up and how it goes out.',
    sectionTextTitle: 'Texts',
    sectionTextHint:
      'All four languages on one screen. Where one is missing, the German text is sent (§20.6).',
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
      'The city of Zurich is deliberately not included. The region pages and the search optimisation target these municipalities.',

    regionsAdd: 'Add a municipality',
    regionsAddTitle: 'New municipality',
    regionsAddLead:
      'It counts from the moment you save: the request flow accepts addresses with this postcode straight away. Its own page appears the next time the website is deployed.',
    regionsEditTitle: 'Edit «{name}»',
    regionsFieldPostcode: 'Postcode',
    regionsFieldPostcodeHint: 'Four digits. Decides which addresses count as inside the area.',
    regionsFieldName: 'Municipality',
    regionsFieldNameHint: 'Appears on the region page and in the coverage check.',
    regionsFieldSlug: 'Page address',
    regionsFieldSlugHint: 'Becomes /areas/{slug}. Derived from the name.',
    regionsFieldLat: 'Latitude',
    regionsFieldLng: 'Longitude',
    regionsCoordsHint:
      'Roughly the centre of the municipality. Scheduling reads it to work out the travel time between two jobs — without sensible coordinates every job here falls outside the free-travel radius.',
    regionsSave: 'Add',
    regionsSaveEdit: 'Save changes',
    regionsCancel: 'Cancel',
    regionsEdit: 'Edit',
    regionsRemove: 'Remove',
    regionsRemoveTitle: 'Remove «{name}» from the service area?',
    regionsRemoveBody:
      'The municipality disappears from the list and from the coverage check. Properties and jobs already on file stay — they will sit in a town the company no longer lists as served.',
    regionsRemoveSeeded:
      'This municipality has its own page at /areas/{slug}. It stays online until the next deploy, advertising a town the request flow will refuse from now on.',
    regionsRemoveConfirm: 'Remove',
    regionsRemoveBlockedTitle: '«{name}» is still in use',
    regionsRemoveBlockedBody:
      '{n} records sit in this municipality: {breakdown}. The postcode cannot be deleted while that is true — every one of those addresses would start reading as outside the service area, with no error anywhere. Switch the municipality off instead: that stops new requests and leaves the past standing.',
    regionsUsageProperties: '{n} properties',
    regionsUsageCustomers: '{n} customer addresses',
    regionsUsageApplications: '{n} applications',
    regionsRemoveBlockedClose: 'Understood',
    regionsErrorPostcodeFormat: 'A postcode is four digits.',
    regionsErrorPostcodeTaken: 'That postcode is already on the list.',
    regionsErrorNameRequired: 'Without a name the tile on the region page is blank.',
    regionsErrorSlugTaken:
      'That address is taken. Two municipalities on one URL means one of them cannot be reached.',
    regionsErrorCoordinates:
      'The coordinates are outside Switzerland. Check latitude and longitude — scheduling does arithmetic with them.',
    regionsAdded: '«{name}» is in the service area.',
    regionsRemoved: '«{name}» was removed.',
    regionsCount: '{n} municipalities, {on} switched on',
    regionsBuildNote:
      'A new municipality counts immediately for requests, quotes and scheduling. Its own page under /areas arrives the next time the website is deployed.',

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


  blog: {
    title: 'Blog',
    lead: 'Write, translate and publish articles. The Blog is the one page on the website that carries something other than a price.',
    back: 'Back to website text',
    backToList: 'Back to the blog',
    createAction: 'New article',
    untitled: 'Untitled',

    search: 'Search articles',
    searchPlaceholder: 'Title, lead or address',
    filterStatus: 'Status',
    filterAll: 'all',
    status: {
      draft: 'Draft',
      published: 'Published',
    },

    colTitle: 'Article',
    colAuthor: 'By',
    colReading: 'Reading',
    colLanguages: 'Languages',
    colDate: 'Date',
    colStatus: 'Status',
    translationGap: '{n} languages missing',

    rowEdit: 'Edit',
    rowView: 'View on the website',
    rowPublish: 'Publish',
    rowWithdraw: 'Withdraw',
    rowDelete: 'Delete',

    publishTitle: 'Publish «{name}»?',
    publishBody:
      'The article appears in the Blog and in the sitemap. Both happen at the next deploy of the website — not immediately.',
    publishConfirm: 'Publish',
    publishDone: '«{name}» is published.',
    withdrawTitle: 'Withdraw «{name}»?',
    withdrawBody:
      'The article becomes a draft again. The publication date stays — publishing it later gives you the same article, not a new one.',
    withdrawConfirm: 'Withdraw',
    withdrawDone: '«{name}» is a draft again.',
    deleteTitle: 'Delete «{name}»?',
    deleteBody:
      'The article is removed for good. Unlike a customer there is no archive here: no invoice hangs off a piece of writing, so there is nothing that has to survive it.',
    deleteConfirm: 'Delete',
    deleteDone: '«{name}» was deleted.',

    emptyTitle: 'Nothing written yet',
    emptyBody:
      'The Blog is the cheapest marketing a cleaning company has: answering the questions that get asked on the phone twenty times a week anyway.',
    searchEmptyTitle: 'No article found',
    searchEmptyBody: 'Nothing matches «{query}».',

    editorLead: 'Everything saves as you type. Publishing happens in the list — that is the one decision no keystroke should make.',
    localeTab: 'Language',
    gapShort: 'missing',
    basicsTitle: 'The article',
    fieldTitle: 'Title',
    fieldExcerpt: 'Lead paragraph',
    fieldExcerptHint: 'Shown under the title on the index, and used as the search-engine description.',
    fieldSlug: 'Page address',
    fieldSlugHint: 'Becomes /blog/{slug}. One for every language — four URLs for one article split whatever search value it earns four ways.',
    fieldAuthor: 'Written by',
    fieldAuthorHint: 'The name goes under the title. An unsigned article reads as filler.',
    fieldService: 'Related service',
    fieldServiceHint: 'Sets the box at the foot of the article that leads to a request. No choice, no box.',
    serviceNone: 'None',
    coverTitle: 'Image',
    fieldCover: 'Cover image',
    fieldCoverHint: 'From the images already in the project. There is no upload in this prototype.',
    fieldCoverAlt: 'Image description',
    fieldAltHint: 'What is in the picture — for everybody who cannot see it.',
    imageNone: 'No image',
    fieldImage: 'Image in this section',
    fieldImageAlt: 'Image description',
    moveUp: 'Move up',
    moveDown: 'Move down',
    fieldHeading: 'Heading',

    blocksTitle: 'The article',
    blocksLead:
      'An article is made of blocks. Each carries its own text per language — so German and English can differ in length and still be the same article.',
    blocksEmpty:
      'No blocks yet. Start with a heading, then a paragraph — the order can be changed at any time.',
    addBlock: 'Add a block:',
    removeBlock: 'Remove block',
    kind: {
      paragraph: 'Paragraph',
      heading: 'Heading',
      list: 'List',
      numbered: 'Numbered',
      quote: 'Quote',
      image: 'Image',
      cta: 'Call to action',
    },
    marksHint:
      'Select and format: bold, italic, link. The asterisks in the text are the formatting — they do not appear on the website.',
    markBold: 'Bold',
    markItalic: 'Italic',
    markLink: 'Insert a link',
    fieldText: 'Text',
    fieldLevel: 'Level',
    levelSection: 'Section',
    levelSub: 'Sub-point',
    fieldItems: 'Points',
    fieldItemsHint: 'One point per line.',
    fieldAttribution: 'Who says this?',
    fieldAttributionHint: 'Optional. An unattributed quote is perfectly normal.',
    fieldImageHint: 'From the images already in the project. There is no upload in this prototype.',
    fieldCtaText: 'The sentence before it',
    fieldCtaTextHint: 'Optional. One sentence saying where the button goes.',
    fieldCtaLabel: 'Button label',
    fieldCtaHref: 'Target',
    fieldCtaHrefHint: 'A path on this website, e.g. /request or /abos.',
    boardTitle: 'Blog',
    boardBody: '{n} articles, {drafts} of them drafts.',
    boardAction: 'Manage articles',
  },
  changelog: {
    title: 'Change log',
    lead: 'Who changed what, and when.',
    colWhen: 'When',
    colActor: 'Who',
    colEntity: 'What',
    colSummary: 'Change',
    search: 'Who, what, or which change',
    searchEmptyTitle: 'No entries found',
    searchEmptyBody: 'Nothing in the log for “{query}”.',
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
