/**
 * The money section — invoices, expenses, analytics.
 *
 * Its own file, because `crm.en.ts` already carries the invoice keys at 700
 * lines and the two new screens bring as much again. The invoice keys stay
 * where they are: screen 71 has read them from there since wave 74, and moving
 * them would be a diff across a file this change has nothing to do with.
 */
export const adminFinanceEn = {
  finance: {
    /* The two link labels on the tiles at the top. They used to live in the tab
       strip above the page; that is gone now that each of the three screens has
       a row of its own in the sidebar. */
    linkInvoices: 'Invoices',
    linkExpenses: 'Expenses',

    title: 'Analytics',
    lead: 'What came in, what went out, and what is left.',

    /* Above the numbers rather than below them: anybody reading a margin has to
       know first which costs are not in it. */
    basisTitle: 'How this is counted',
    basisBody:
      'Counted by the month the work happened in, not the day the money moved. A job cleaned in March belongs to March even if the invoice is paid in May. Drafts and cancelled invoices do not count.',
    basisOwner:
      'The owner’s own pay is not in the costs. What reads as “profit” is what is left before that and before tax.',

    rangeLabel: 'Period',
    range3: 'Last 3 months',
    range6: 'Last 6 months',
    range12: 'Last 12 months',

    statRevenue: 'Revenue',
    statRevenueHint: '{n} invoices in the period.',
    statCosts: 'Costs',
    statCostsHint: '{n} receipts in the period.',
    statProfit: 'Profit',
    statProfitHint: '{percent}% margin.',
    statProfitNoRevenue: 'No revenue, so no margin.',
    statLoss: 'Loss',
    statOutstanding: 'Outstanding',
    statOutstandingHint: 'Billed and not yet paid — across every period.',
    statOutstandingNone: 'Nothing outstanding.',
    statCommitment: 'Fixed costs',
    statCommitmentHint: 'Runs on whether or not the month does.',

    chartTitle: 'Month by month',
    chartLead: 'Revenue and costs side by side. The current month is not finished yet.',
    chartRevenue: 'Revenue',
    chartCosts: 'Costs',
    chartCurrent: 'still running',
    chartEmptyTitle: 'Nothing to add up yet',
    chartEmptyBody:
      'As soon as the first invoice is approved or the first receipt is recorded, the year shows up here.',

    downloadAction: 'Download months',
    downloadDone: '{n} months downloaded.',

    tableTitle: 'The same figures',
    /* The chart is the quick answer, the table the exact one — and the only one
       that can be read aloud. Both read the same arithmetic. */
    tableLead: 'The same months, to check against and to read out.',
    colMonth: 'Month',
    colRevenue: 'Revenue',
    colCosts: 'Costs',
    colProfit: 'Result',

    categoriesTitle: 'Where the costs go',
    categoriesLead: 'Largest first. Categories with no receipt in the period are left out.',
    categoriesEmptyTitle: 'No costs in this period',
    categoriesEmptyBody: 'No receipt was recorded in these months.',
    categoryShare: '{percent}% of costs',
    categoryCount: '{n} receipts',
    categoryCountOne: '1 receipt',
  },

  expenses: {
    title: 'Expenses',
    lead: 'What the business costs — supplies, vehicle, rent, insurance. The other half of the analytics.',
    search: 'Supplier, number or note',
    searchPlaceholder: 'e.g. Garage Rüegg',
    filterCategory: 'Category',
    filterStatus: 'Status',
    filterAll: 'All',
    filterOutstanding: 'Outstanding',
    filterReset: 'Reset filters',

    colReference: 'Number',
    colSupplier: 'Supplier',
    colCategory: 'Category',
    colAmount: 'Amount',
    colIncurred: 'Date',
    colDue: 'Due',
    colMethod: 'Paid by',
    colNote: 'Note',
    colStatus: 'Status',
    noDueDate: 'No deadline',
    overdueBy: '{days} d. overdue',
    dueIn: 'in {days} d.',
    recurring: 'Monthly',

    newAction: 'Record an expense',
    rowOpen: 'Open expense',
    rowEdit: 'Edit expense',
    rowMarkPaid: 'Record as paid',
    rowDelete: 'Delete expense',
    deleteConfirmTitle: 'Delete this expense?',
    deleteConfirm:
      '{reference} — {supplier}, {amount}. The receipt leaves the analytics with it. This cannot be undone.',
    deleteDone: '{reference} deleted.',

    paidTitle: 'Record as paid',
    paidBody: '{reference} — {supplier}, {amount}.',
    /* The route is required, for the reason it is on an invoice: “paid” with no
       route is half an answer. */
    paidMethod: 'Paid how?',
    paidAction: 'Record as paid',
    paidDone: '{reference} recorded as paid.',

    downloadAction: 'Download expenses',
    downloadEmpty: 'Nothing to download — the list is empty.',
    downloadDone: '{n} receipts downloaded.',

    emptyTitle: 'No expenses recorded yet',
    emptyBody:
      'With no costs the analytics show one half of the picture. The first receipt — supplies, fuel, rent — is what makes the profit readable.',
    filterEmptyTitle: 'No expense matches',
    filterEmptyBody: 'Search and filters rule everything out. Resetting shows them all again.',

    categories: {
      supplies: 'Supplies',
      vehicle: 'Vehicle',
      wages: 'Wages',
      insurance: 'Insurance',
      marketing: 'Marketing',
      software: 'Software',
      rent: 'Rent',
      other: 'Other',
    },
  },

  expense: {
    back: 'All expenses',
    newTitle: 'Record an expense',
    newLead: 'A receipt that belongs to the business. Open to begin with — settling it is the next step.',
    notFoundTitle: 'This expense does not exist',
    notFoundBody: 'The receipt was deleted, or the link is no longer right.',

    sectionWhatTitle: 'What, and to whom',
    supplierLabel: 'Supplier',
    supplierHint: 'Who was paid — as it reads on the receipt.',
    categoryLabel: 'Category',
    noteLabel: 'Note',
    noteHint: 'What exactly it was for. Shows in the list and in the export.',

    sectionMoneyTitle: 'Amount and deadline',
    amountLabel: 'Amount CHF',
    amountHint: 'Gross, as it leaves the account. No VAT split — the company is not VAT registered.',
    incurredLabel: 'Date',
    incurredHint: 'The day the cost arose. That is the month it counts in.',
    dueLabel: 'Payable by',
    dueHint: 'Leave empty when it was settled on the spot — then nothing can fall overdue.',
    recurringLabel: 'Runs every month',
    recurringHint:
      'Rent, insurance, subscriptions. Counted as fixed costs in the analytics. Next month’s copy is not created for you.',

    sectionJobTitle: 'Belongs to a job',
    bookingLabel: 'Job',
    bookingHint: 'Only when the cost really belongs to one. A tank of fuel belongs to the month.',
    bookingNone: 'Not tied to a job',

    statusTitle: 'Paid',
    statusPaid: 'Paid on {date} — {method}.',
    statusOpen: 'Still open.',
    statusOverdue: 'Overdue by {days} days.',

    errorSupplier: 'Required.',
    errorAmount: 'Must be greater than 0.',
    errorDueBeforeIncurred: 'The deadline falls before the date of the cost.',

    save: 'Save',
    create: 'Record expense',
    cancel: 'Cancel',
    discard: 'Discard changes',
    unsaved: 'Not saved.',
    created: '{reference} recorded.',
    saved: '{reference} saved.',
  },
};
