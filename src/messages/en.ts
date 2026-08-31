import type { Messages } from './de';

/**
 * English is typed against the German shape — a missing or renamed key fails
 * the build instead of silently rendering a blank label.
 */
export const en: Messages = {
  brand: {
    name: 'Homivaro',
    tagline: 'Clean. Reliable. Swiss quality.',
    region: 'Right shore of Lake Zurich',
    phone: '+41 44 599 91 36',
    mobile: '076 227 79 66',
    email: 'info@homivaro.ch',
  },

  nav: {
    services: 'Services',
    pricing: 'Pricing',
    packages: 'Plans',
    gallery: 'Our work',
    about: 'About us',
    contact: 'Contact',
    careers: 'Jobs',
    login: 'Sign in',
    requestQuote: 'Request a quote',
    menu: 'Menu',
    close: 'Close',
    skipToContent: 'Skip to content',
  },

  actions: {
    next: 'Continue',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    send: 'Send',
    submit: 'Submit',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    skip: 'Skip',
    retry: 'Try again',
    showMore: 'Show more',
    showLess: 'Show less',
    reveal: 'Reveal',
    hide: 'Hide',
    copy: 'Copy',
    download: 'Download',
    search: 'Search',
    filter: 'Filter',
    reset: 'Reset',
    apply: 'Apply',
    viewDetails: 'View details',
    callNow: 'Call us',
    whatsapp: 'WhatsApp',
  },

  common: {
    loading: 'Loading …',
    optional: 'optional',
    required: 'required',
    yes: 'Yes',
    no: 'No',
    from: 'from',
    perHour: 'per hour',
    hours: '{count, plural, one {# hour} other {# hours}}',
    minutes: '{count, plural, one {# minute} other {# minutes}}',
    estimate: 'Estimate',
    estimateNote: 'The binding price is stated in your quote.',
    of: 'of',
    step: 'Step {current} of {total}',
    notSet: '—',
    internalOnly: 'Internal only',
  },

  money: {
    perHour: '{amount} / hr',
    perUnit: '{amount} / unit',
    perMonth: '{amount} / month',
    perVisit: '{amount} / visit',
    total: 'Total',
    noVat: 'No VAT — final price',
  },

  status: {
    request: {
      draft: 'Draft',
      new: 'New',
      inReview: 'In review',
      offerSent: 'Quote sent',
      revisionRequested: 'Change requested',
      accepted: 'Accepted',
      /* The same word the booking uses — it is the same event seen from the
         quote's end rather than the job's. */
      completed: 'Completed',
      rejected: 'Declined',
      expired: 'Expired',
      cancelledByCustomer: 'Cancelled by customer',
      cancelledByCompany: 'Cancelled by us',
    },
    booking: {
      scheduled: 'Scheduled',
      rescheduled: 'Rescheduled',
      inProgress: 'In progress',
      noAccess: 'No access',
      awaitingApproval: 'Approval pending',
      completed: 'Completed',
      invoiced: 'Invoiced',
      closed: 'Closed',
      cancelled: 'Cancelled',
    },
    calendarEvent: {
      upcoming: 'Upcoming',
      done: 'Done',
      /* "No reply" described the call, not where it stands. Pending is where
         it stands: somebody has to try again. */
      pending: 'Pending',
      inProgress: 'In progress',
      cancelled: 'Called off',
    },
    subscription: {
      active: 'Active',
      paused: 'Paused',
      expired: 'Expired',
      cancelled: 'Cancelled',
    },
    invoice: {
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled',
    },
    /* The same words as an invoice, because they are the same states running
       the other way. "Open" here means: we still owe this. */
    expense: {
      open: 'Open',
      overdue: 'Overdue',
      paid: 'Paid',
    },
    review: {
      pending: 'Awaiting review',
      published: 'Published',
      hidden: 'Hidden',
      rejected: 'Not published',
    },
    application: {
      new: 'New',
      inReview: 'In review',
      accepted: 'Accepted',
      rejected: 'Not selected',
    },
    payment: {
      pending: 'Pending',
      succeeded: 'Paid',
      failed: 'Failed',
      refunded: 'Refunded',
    },
    key: {
      held: 'Held',
      returned: 'Returned',
    },
    /* "Disabled" rather than "Inactive": the state is the result of a
       decision, not somewhere a service drifts on its own. */
    service: {
      draft: 'Draft',
      active: 'Active',
      inactive: 'Disabled',
    },
    /* "Available", not "Active". The add-on does nothing itself — the question
       the switch answers is whether a customer can pick it today. */
    addOn: {
      active: 'Available',
      inactive: 'Unavailable',
    },
    /* "Fully redeemed" rather than "Used up": the cap was reached, which is
       the campaign working, not the record breaking. */
    coupon: {
      scheduled: 'Starts later',
      active: 'Valid',
      'used-up': 'Fully redeemed',
      expired: 'Expired',
      inactive: 'Disabled',
    },
    /* Not the state of a payment but its route. Here because it used to live in
       three places: the customer's account, the quote's payment step, and
       `admin.offers.method` — inside a single screen's namespace. */
    method: {
      twint: 'TWINT',
      card: 'Card',
      'apple-pay': 'Apple Pay',
      'google-pay': 'Google Pay',
      'qr-bill': 'QR-bill',
      cash: 'Cash',
    },
  },

  form: {
    errorRequired: 'This field is required.',
    errorEmail: 'Please enter a valid email address.',
    errorPhone: 'Please enter a valid phone number.',
    errorPostcode: 'Please enter a four-digit postcode.',
    errorNumber: 'Please enter a number.',
    errorMin: 'At least {min}.',
    errorMax: 'At most {max}.',
    errorFileType: 'This file type is not supported. Allowed: JPG, PNG, PDF.',
    errorFileSize: 'This file is too large. Maximum {max} MB.',
    savedDraft: 'Your answers are saved. You can pick this up any time.',
  },

  /* The form a payment method is put on file with — up here rather than under
     `account` or `admin`, because both screens do it: the customer under
     /konto/zahlungsmittel and the owner on the customer record. The card fields
     used to live only in `admin.crm`, where screen 45 could not reach them —
     which is exactly why 45 asked for nothing at all. */
  paymentForm: {
    cardNumber: 'Card number',
    cardNumberError: 'A card number has 13 to 19 digits.',
    cardName: 'Name on the card',
    cardExpiry: 'Expires',
    cardExpiryHint: 'MM/YY',
    cardExpiryError: 'The month has to be between 01 and 12.',
    cardCvv: 'Security code',
    cardCvvHint: 'Three digits on the back.',
    cardStorage:
      'We keep the card type, the last four digits and the expiry date. The number, the name and the security code are not stored.',
    twintPhone: 'Mobile number',
    /* No possessive, because two people fill this one field in: the customer
       with her own number, the owner with hers off the phone. "Your" is simply
       the wrong person on screen 65. */
    twintPhoneHint: 'The mobile number TWINT is registered to.',
    twintPhoneError: 'Please enter a Swiss mobile number, e.g. 079 123 45 66.',
    twintStorage:
      'We keep the first three and the last two digits. TWINT covers one-off jobs — a plan is never charged to it.',
    walletDevice: 'Device',
    walletDeviceHint: 'Which device is the wallet on?',
    /* The one place the prototype admits it is standing in for a sheet it
       cannot open. Without it the device picker reads as a shortened card
       form. */
    walletStorage:
      'In the finished product this is confirmed in the wallet on the device; card details are never typed in. All we keep is which device it was.',
    save: 'Save',
    cancel: 'Cancel',
  },

  empty: {
    genericTitle: 'Nothing here yet',
    genericBody: 'As soon as something arrives, it will show up here.',
    searchTitle: 'No matches',
    searchBody: 'We found nothing for “{query}”. Try a different term.',
  },

  errors: {
    genericTitle: 'That did not work',
    genericBody: 'Please try again. If it keeps happening, give us a call.',
    notFoundTitle: 'This page does not exist',
    notFoundBody: 'The link may be out of date. These routes will get you back:',
    retry: 'Try again',
    home: 'Back to the homepage',
    callUs: 'Call us',
    reference: 'Error reference {id}',
    referenceHint: 'Quote this reference if you call.',
    loading: 'Loading',
  },

  footer: {
    servicesHeading: 'Services',
    companyHeading: 'Company',
    legalHeading: 'Legal',
    contactHeading: 'Contact',
    terms: 'Terms',
    privacy: 'Privacy',
    imprint: 'Imprint',
    areasHeading: 'Service area',
    hours: 'Mon–Sat, 07:00–18:00',
    rights: '© {year} Homivaro. All rights reserved.',
    careersCta: 'We are hiring',
  },

  app: {
    menu: 'Menu',
    backToSite: 'Back to homivaro.ch',
    signOut: 'Sign out',
    signOutConfirm: 'Sign out? The demo data stays as it is.',
    userMenu: 'Account menu',
    notifications: 'Notifications',
    notificationsEmpty: 'Nothing waiting.',
    notificationsAll: 'See all',
    density: 'Density',
    densityComfortable: 'Comfortable',
    densityCompact: 'Compact',
    collapseGroup: 'Collapse group',
    sidebarCollapse: 'Collapse menu',
    sidebarExpand: 'Expand menu',
    search: 'Search',
    searchPlaceholder: 'Name, reference, street, invoice number …',
    searchEmpty: 'No matches. Keep typing, or try another term.',
    searchIdle: 'Type to search — or jump straight to a screen.',
    searchOpenHint: 'Open',
    searchGroupPages: 'Pages',
    searchGroupCustomers: 'Customers',
    searchGroupRequests: 'Requests',
    searchGroupOffers: 'Quotes',
    searchGroupInvoices: 'Invoices',
    searchGroupProperties: 'Properties',
    searchGroupAll: 'More',
    searchAllResults: 'See all {total} results',
    results: '{shown} of {total}',
    resultsAll: '{total, plural, one {# entry} other {# entries}}',
    clearSearch: 'Clear search',
    selected: '{n} selected',
    loading: 'Loading',
    pagePrevious: 'Previous',
    pageNext: 'Next',
    pageLabel: 'Pagination',
    pageSummary: '{from}–{to} of {total}',
    pagePerPage: '{n} rows per page',
    rowActions: 'Actions',
    saving: 'Saving …',
    saved: 'Saved',
    attachments: {
      label: '{count, plural, one {# attachment} other {# attachments}}',
      attach: 'Attach a file',
      uploading: 'Uploading …',
      mockNotice: 'Upload is mocked — JPG, PNG, WEBP or PDF, up to 10 MB.',
      errorType: 'Only JPG, PNG, WEBP or PDF.',
      errorSize: '“{name}” is larger than {max} MB.',
      staged: 'Attachments ready to send',
      remove: 'Remove “{name}”',
    },
  },

  demo: {
    title: 'Demo controls',
    open: 'Open demo controls',
    close: 'Close demo controls',
    theme: 'Direction',
    locale: 'Language',
    role: 'Role',
    customer: 'Customer account',
    scenario: 'Scenario',
    today: 'Today is',
    todayReset: 'Today',
    todayActive: 'Date overridden',
    insurance: 'Liability insurance',
    stress: 'DE stress test',
    stressHint: 'Grows every string by ~30% — surfaces layout breaks now.',
    reset: 'Reset demo',
    resetConfirm: 'Reset all demo data to its initial state?',
    screens: 'Screen index',
    flows: 'Flow index',
    openQuestions: 'Open questions',
    foundations: 'Design tokens',
    designSystem: 'Design system',
    roles: {
      visitor: 'Visitor',
      customer: 'Customer',
      owner: 'Owner',
      contractor: 'Team member',
    },
    scenarios: {
      demo: 'Default',
      fresh: 'Day 1 — everything empty',
      busy: 'Full week',
      overdue: 'Overdue invoices',
      away: 'Owner away',
      conflict: 'Slot collision',
      hiring: 'Applications',
      states: 'Every state',
    },
  },
};
