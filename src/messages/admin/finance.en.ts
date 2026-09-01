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
    linkWorkforce: 'Break it down by person',

    title: 'Analytics',
    lead: 'What came in, what went out, and what is left.',

    /* Above the numbers rather than below them: anybody reading a margin has to
       know first which costs are not in it. */
    basisTitle: 'How this is counted',
    basisBody:
      'Counted by the month the work happened in, not the day the money moved. A job cleaned in March belongs to March even if the invoice is paid in May. Drafts and cancelled invoices do not count.',
    /* The qualifier at the end is new and needed: now that «Labour» exists,
       the owner’s own pay *can* land in the costs — the moment somebody books
       hours to the owner. Without it the sentence would be false on the very
       screen it is printed on. */
    basisOwner:
      'The owner’s own pay is not in the costs — unless it is booked as labour hours on a job. What reads as “profit” is what is left before that and before tax.',

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
    /* The job is in there now, because «what did B-1052 cost» is the question
       people ask out loud — and the one this box could not answer. */
    search: 'Supplier, number, note or job',
    searchPlaceholder: 'e.g. Garage Rüegg or B-1052',
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
    /* Was “Paid by”, which now means a person on a labour row. A route and a
       payer are different facts and one label cannot carry both. */
    colMethod: 'Payment route',
    colNote: 'Note',
    colStatus: 'Status',
    /* Only filled on a labour row — and present for every row in the export,
       because a column that appears on some rows and not others shifts the
       whole table in a spreadsheet. */
    colHours: 'Hours',
    colWorker: 'Person',
    colPaidBy: 'Paid by',
    colResponsible: 'Responsible',
    colJob: 'Job',
    filterWorker: 'Person',
    hours: '{hours} h',
    workforceAction: 'Workforce',
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
      /* «Labour», not «Wages 2»: one is hours on a job, the other is the
         payout at the end of the month. Two headings, because they are two
         different questions. */
      labour: 'Labour',
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
    categoryHintLabour:
      '“Labour” is one person on one job. “Wages” is the payout at the end of the month, with no job behind it.',
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
    bookingHintLabour:
      'Required for labour. Hours with no job on them are a payout — that is what “Wages” is for.',
    bookingNone: 'Not tied to a job',
    bookingNoneLabour: 'Pick a job',

    sectionLabourTitle: 'Who worked',
    sectionLabourLead:
      'The chain that makes this category recordable at all: job → person → hours → amount → who paid → who carries it.',
    workerLabel: 'Person',
    workerHint: 'Who put in the hours. Shows in the list where the supplier normally does.',
    workerNone: 'Pick a person',
    hoursLabel: 'Hours',
    hoursHint: 'Decimal — 3.5, not 3:30.',
    /* The job already knows: check-in to check-out sits on the booking.
       Offered rather than written — somebody who forgets to check out would
       otherwise book an eleven-hour day. */
    hoursOnSite: 'On site it was {hours} h — check-in to check-out.',
    hoursReported: '{hours} h were reported at check-out.',
    hoursUse: 'Use it',
    paidByLabel: 'Paid by',
    paidByHint: 'Whose account the money leaves. Whether it has left is what the status says.',
    responsibleLabel: 'Responsible',
    responsibleHint: 'Who the cost belongs to — who signed it off.',
    rateHint: 'That is {rate} an hour.',
    rateHintNone: 'The hourly rate appears once the amount and the hours are in.',
    inactiveMember: '{name} (inactive)',

    errorWorker: 'Required.',
    errorHours: 'Must be greater than 0.',
    errorBooking: 'Required for labour.',
    errorPaidBy: 'Required.',
    errorResponsible: 'Required.',
    noTeamTitle: 'Nobody on the team yet',
    noTeamBody:
      'Labour needs a person. As soon as an application is accepted, hours can be booked here.',
    noJobTitle: 'No finished job yet',
    noJobBody: 'Labour hangs off a job. There is nothing to book until one has run.',

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

  /*
   * Screen 71e — the people side of the expenses.
   *
   * Its own namespace rather than keys inside `expenses`, because it is a
   * different question: the expense list shows receipts, this screen shows
   * people and jobs. Sharing the keys would mean a column heading eventually
   * being wrong on one of the two screens.
   */
  workforce: {
    title: 'Workforce',
    lead: 'Who was on which job, for how long, what it cost — and who pays for it.',
    back: 'All expenses',

    rangeLabel: 'Period',
    range3: 'Last 3 months',
    range6: 'Last 6 months',
    range12: 'Last 12 months',

    statHours: 'Hours',
    statHoursHint: '{n} entries across {jobs} jobs.',
    statHoursNone: 'Nothing recorded in this period.',
    statCost: 'Labour cost',
    statCostHint: 'Counted under “Labour” in the analytics.',
    statRate: 'Avg. hourly rate',
    statRateHint: 'Amount divided by hours — there is no rate card behind it.',
    statRateNone: 'No hours, no rate.',
    statOpen: 'Not paid out yet',
    statOpenHint: 'Recorded and still open — in the chosen period.',
    statOpenNone: 'Everything paid out.',
    statPeople: 'People',
    linkAnalytics: 'See it in the analytics',

    search: 'Person, job or number',
    searchPlaceholder: 'e.g. Marta',
    filterWorker: 'Person',
    filterStatus: 'Status',
    filterAll: 'All',
    filterOutstanding: 'Outstanding',
    filterReset: 'Reset filters',

    tableTitle: 'Job by job',
    tableLead: 'One row per person recorded on a job. Two people on one job are two rows.',
    colJob: 'Job',
    colWhen: 'Date',
    colWorker: 'Person',
    colHours: 'Hours',
    colAmount: 'Amount',
    colRate: 'Rate',
    colPaidBy: 'Paid by',
    colResponsible: 'Responsible',
    colStatus: 'Status',
    hours: '{hours} h',
    perHour: '{rate}/h',

    rowOpen: 'Open receipt',
    rowJob: 'Open job',
    rowPerson: 'Open person',
    rowMarkPaid: 'Record as paid',

    peopleTitle: 'By person',
    peopleLead: 'Most hours first. Anyone with nothing booked in the period is left out.',
    colPerson: 'Person',
    colJobs: 'Jobs',
    colOutstanding: 'Outstanding',
    jobsCount: '{n} jobs',
    jobsCountOne: '1 job',

    jobsTitle: 'By job',
    jobsLead: 'What a job cost in people. Newest first.',
    colCrew: 'Who',
    crewMore: '+{n}',

    newAction: 'Record labour',
    downloadAction: 'Download labour',
    downloadEmpty: 'Nothing to download — the list is empty.',
    downloadDone: '{n} entries downloaded.',

    emptyTitle: 'No labour recorded yet',
    emptyBody:
      'With no hours on a job, the analytics can only say what a job brought in — not what it cost in people.',
    filterEmptyTitle: 'No entry matches',
    filterEmptyBody: 'Search and filters rule everything out. Resetting shows them all again.',
    windowEmptyTitle: 'Nothing recorded in this period',
    windowEmptyBody: 'No hours were booked in these months. A longer period may show more.',
  },
};
