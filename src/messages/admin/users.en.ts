import type { adminUsersDe } from './users.de';

/** Users & access — screens U1–U5. Typed against German, which owns the shape. */
export const adminUsersEn: typeof adminUsersDe = {
  /*
   * One namespace, five screens. Nested rather than five siblings on
   * `admin`, because `admin.detail` and `admin.edit` are names any screen
   * could have claimed — and the dictionaries are merged flat, so the first
   * one to claim it would have silently won.
   */
  users: {
    areas: {
      requests: 'Read and answer incoming enquiries.',
      offers: 'Write, send and chase quotes.',
      bookings: 'Every job, with address, time and state.',
      calendar: 'The calendar, with every appointment and who is on it.',
      customers: 'Customer records, contact details and history.',
      messages: 'The message thread with customers.',
      properties: 'Properties, including access method and notes.',
      keys: 'Who holds which key — and where it is kept.',
      subscriptions: 'Plans, terms and renewals.',
      invoices: 'Raise, approve and settle invoices.',
      expenses: 'Record costs and file receipts.',
      analytics: 'Revenue, costs and margin across every month.',
      catalogue: 'Change services and prices.',
      addons: 'Add-ons and what they cost.',
      coupons: 'Create and close discount codes.',
      reviews: 'Publish, answer and hide reviews.',
      templates: 'The wording of every automatic message.',
      applications: 'Application files, including ID and work permit.',
      postings: 'Job adverts on the careers page.',
      users: 'Create accounts, switch them off, grant rights.',
      settings: 'Hours, surcharges, regions and rules.',
      changelog: 'Who changed what, and when.',
    },

    roles: {
      owner: 'Management',
      contractor: 'Team member',
      /* "Office", not "admin". The word says where the person sits, and that is
         exactly the difference from a team member: they do not drive out, so
         they never appear in a job assignment. */
      office: 'Office',
    },
    roleHints: {
      owner: 'Sees everything. Rights cannot be narrowed.',
      contractor: 'Drives out. Gets assigned jobs.',
      office: 'Works from the office. Never assigned a job.',
    },

    list: {
      title: 'Users',
      lead: 'Who can sign in — and what they may open once they have.',
      addAction: 'Add user',
      search: 'Name or email',
      filterRole: 'Role',
      filterAll: 'All',
      tabActive: 'Active',
      tabDeactivated: 'Deactivated',

      colName: 'Name',
      colRole: 'Role',
      colAccess: 'Access',
      colContact: 'Contact',
      colSince: 'Since',
      colDeactivated: 'Deactivated',
      colStatus: 'Status',

      accessAll: 'Everything',
      accessNone: 'No access',
      accessCount: '{n} areas',
      accessOne: '1 area',

      rowOpen: 'Open user',
      rowEdit: 'Edit details',
      rowRights: 'Access rights',
      rowReset: 'Create password link',
      rowDeactivate: 'Deactivate',
      rowReactivate: 'Reactivate',
      rowDelete: 'Delete',

      denySelf: 'Not on your own account',
      denyOwner: 'Not on management',
      denyHistory: 'Has records — deactivate instead',
      denyInactive: 'Account is deactivated',

      emptyTitle: 'Only you',
      emptyBody:
        'Add the first account, or accept an application — both land on this list.',
      deactivatedEmptyTitle: 'Nobody deactivated',
      deactivatedEmptyBody:
        'Deactivated accounts stay here with everything they recorded. Nothing is deleted.',
      searchEmptyTitle: 'Nothing found',
      searchEmptyBody: 'No account matches “{query}”.',
      filterEmptyBody: 'No account has that role.',
    },

    detail: {
      back: 'All users',
      contactTitle: 'Contact',
      since: 'Here since',
      deactivatedOn: 'Deactivated on {date}',
      fromApplication: 'From application {reference}',
      editAction: 'Edit',
      rightsAction: 'Change access',

      accessTitle: 'Access to the console',
      accessLead: 'These are the entries in this person’s sidebar.',
      accessOwner: 'Management sees everything. These rights cannot be narrowed.',
      accessNoneTitle: 'No access to the console',
      accessNoneBody:
        'This person works from the job view on their phone. Opening the console shows them a lock screen saying exactly that.',
      accessNoneOffice:
        'This account can sign in and then see nothing. Grant some rights, or it is an account with no purpose.',

      statusTitle: 'Status',
      deactivateAction: 'Deactivate account',
      reactivateAction: 'Reactivate account',
      deactivatedNoteTitle: 'This account is deactivated',
      deactivatedNoteBody:
        'Signing in no longer works. Everything this person recorded is still there — and their rights are kept, in case they come back.',

      passwordTitle: 'Password',
      passwordLead:
        'Homivaro never sends passwords. You create a link and pass it on yourself.',
      passwordAction: 'Create password link',
      passwordAgain: 'Create a new link',
      passwordNever: 'No link has been created yet.',
      passwordIssued: 'Created {when} · valid until {until}',
      passwordExpired: 'The last link, from {when}, has expired.',
      passwordCopy: 'Copy link',
      passwordCopied: 'Link copied',
      passwordOpen: 'Open the page',
      passwordReveal: 'Show link',
      passwordHide: 'Hide link',
      passwordDone: 'Link created for {name} — good for {hours} hours.',
      passwordWarning:
        'The link is only shown while this page is open. You can always make another, but this one will be gone.',

      historyTitle: 'What stays, either way',
      historyLead:
        'A deactivated account loses none of this. Nor would a deleted one — which is why deleting is only offered once there is nothing here.',
      historyBookings: 'Jobs',
      historyEvents: 'Calendar entries',
      historyLog: 'Change-log entries',
      historyNone: 'This account has not recorded anything yet.',
      historyOpenLog: 'See them in the change log',

      fieldTitle: 'Field work',
      regionsTitle: 'Regions covered',
      skillsTitle: 'Services cleared for',
      skillsHint: 'Only cleared services can be assigned.',
      jobsTitle: 'Upcoming jobs',
      jobsEmpty: 'No jobs assigned at the moment.',
      officeNoteTitle: 'No jobs',
      officeNoteBody:
        'An office account appears in no assignment — not in the calendar, and not when a job is created.',

      dangerTitle: 'Delete account',
      dangerBody:
        'Deleting is final and archives nothing. For anybody who has ever recorded something, deactivating is the right move.',
      deleteAction: 'Delete account',
      deleteBlockedHistory:
        'Not possible: {n} records carry this name. Deactivate the account instead — everything is kept.',
      deleteBlockedSelf: 'You cannot delete your own account.',
      deleteBlockedOwner: 'The management account cannot be deleted.',
    },

    confirm: {
      deactivateTitle: 'Deactivate {name}?',
      deactivateBody:
        'They can no longer sign in. Recorded jobs, expenses and change-log entries stay exactly as they are.',
      deactivateJobs:
        'Careful: {n} upcoming jobs are assigned to this person. They are neither cancelled nor handed on — reassign them in the calendar.',
      deactivateJobsLink: 'See the jobs in the calendar',
      deactivateAction: 'Deactivate',
      deactivateDone: '{name} is deactivated.',
      reactivateDone: '{name} can sign in again.',

      deleteTitle: 'Delete {name}?',
      deleteBody:
        'The account is removed and cannot be brought back. Nothing is recorded against it — otherwise this would not be offered.',
      deleteAction: 'Delete for good',
      deleteDone: '{name} has been deleted.',
    },

    create: {
      title: 'Add user',
      lead: 'For everybody who did not arrive through an application — office, bookkeeping, a hand for the season.',
      back: 'All users',
      personTitle: 'Person',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      emailHint: 'This is what they sign in with.',
      phone: 'Phone',
      roleTitle: 'Role',
      roleHint: 'Decides whether this person gets assigned jobs — not what they may see.',
      accessTitle: 'Access',
      accessHint: 'A starting point. Fine-tune it afterwards on the access page.',
      accessFullHint: 'All {n} grantable areas — except {except}.',
      accessSummaryNone: 'No access to the console.',
      accessSummary: '{n} areas: {areas}',
      save: 'Create',
      cancel: 'Cancel',
      done: '{name} has been created.',
      errorRequired: 'Please fill this in.',
      errorEmail: 'That email does not look right.',
      duplicateTitle: 'That email is already in use',
      duplicateBody:
        '{name} already uses {email}. Two accounts on one address cannot both sign in.',
      duplicateOpen: 'Open the existing account',
    },

    edit: {
      title: 'Edit {name}',
      lead: 'Name, contact and role. Access rights have a page of their own.',
      back: 'Back to the account',
      save: 'Save',
      cancel: 'Cancel',
      done: 'Saved.',
      roleLockedOwner: 'The management role cannot be changed.',
      roleChangeWarning:
        'As “Office” this person disappears from every job assignment. Jobs already assigned stay where they are.',
    },

    rights: {
      title: 'Access — {name}',
      lead: 'Every switch is one entry in this person’s sidebar. What is off is also unreachable by typing the address.',
      back: 'Back to the account',
      presetsTitle: 'Apply a template',
      presetsHint: 'Sets the switches below. Each one can still be changed afterwards.',
      presets: {
        full: 'Full access',
        operations: 'Operations',
        finance: 'Bookkeeping',
        content: 'Content & marketing',
        field: 'Own schedule only',
      },
      presetApplied: 'Template “{preset}” applied.',
      custom: 'Custom selection',
      selectAll: 'All in this group',
      clearAll: 'Clear everything',
      countNone: 'No area selected',
      countOne: '1 of {total} areas',
      count: '{n} of {total} areas',
      saved: 'Saved',
      savedHint: 'Changes apply immediately — there is no save button.',

      ownerTitle: 'Management sees everything',
      ownerBody:
        'There is no matrix for this account. The rights are not stored but follow from the role — otherwise every new area would lock the owner out until somebody added it.',

      selfTitle: 'Your own account',
      selfBody:
        'You cannot change your own rights here. If you can grant yourself more, the matrix is decoration.',

      lockedTitle: 'Cannot be granted',
      lockedPrivacy: 'Management only — application files (revDSG).',
      lockedEscalation: 'Management only — whoever grants rights can grant themselves all of them.',
      lockedNote:
        'Two areas are deliberately not on offer. They are listed below so that “Full access” does not claim more than it gives.',

      emptyNoticeTitle: 'No access to the console',
      emptyNoticeBody:
        'Signing in still works. Instead of the console this person sees a lock screen telling them to ask management.',
      emptyNoticeField: 'The job view on their phone is unaffected.',
    },
  },
};
