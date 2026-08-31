import type { careersDe } from './de';

export const careersEn: typeof careersDe = {
  index: {
    eyebrow: 'Working at Homivaro',
    title: 'We are looking for people you would hand a key to',
    lead: 'Homivaro cleans private homes and assembles furniture on the right shore of Lake Zurich. Regular clients, a compact area, and work that is judged by the result.',
    openTitle: 'Open roles',
    workload: 'Workload',
    regions: 'Area',
    kindPermanent: 'Permanent',
    kindPartTime: 'Part time',
    kindTemporary: 'Fixed term',
    kindFreelance: 'On call',
    view: 'See the role',

    emptyTitle: 'No open role right now',
    emptyBody:
      'That changes regularly. Send a speculative application — we get in touch as soon as something fits.',
    spontaneousAction: 'Apply speculatively',

    howTitle: 'How we choose',
    howLead:
      'The same things we ask of applicants answer the question customers ask most often: who is standing at my door?',

    statusTitle: 'Already applied?',
    statusBody: 'Your reference number shows you where your application stands, any time.',
    statusAction: 'Check the status',
  },

  posting: {
    eyebrow: 'Open role',
    loading: 'Loading the role',
    back: 'All roles',
    workload: 'Workload',
    regions: 'Area',
    kind: 'Contract',
    published: 'Posted',
    responsibilities: 'What you will do',
    requirements: 'What you bring',
    offer: 'What we offer',
    apply: 'Apply now',
    applyNote: 'Two steps, about five minutes. You can stop halfway.',
    contactTitle: 'Questions first?',
    contactBody: 'Call before you write — the owner answers the phone here.',
  },

  form: {
    stepOf: 'Step {step} of 2',
    step1Title: 'About you',
    step2Title: 'Experience and availability',
    spontaneousTitle: 'Speculative application',
    forPosting: 'Applying for: {title}',
    eyebrow: 'Application',
    title: 'Apply',
    spontaneousLead:
      'No role named, which is fine — tell us what you can do and where you can work, and we will come back to you when something fits.',

    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone',
    postcode: 'Postcode',
    city: 'Town',

    permitTitle: 'Work permit',
    permitHint:
      'We ask this first because it is the one answer we have no room to move on.',
    permitCh: 'Swiss citizen',
    permitC: 'Permit C (settled)',
    permitB: 'Permit B (resident)',
    permitG: 'Permit G (cross-border)',
    permitL: 'Permit L (short stay)',
    permitOther: 'Another permit',
    permitNone: 'No permit yet',
    permitNoneWarning:
      'Without a valid permit we cannot employ you. You can still send the application — we get in touch if that changes.',

    languagesTitle: 'Languages',
    languagesHint: 'You need German to deal with clients.',
    levelNone: '—',
    levelBasic: 'Basic',
    levelConversational: 'Good',
    levelFluent: 'Fluent',
    levelNative: 'Native',

    mobilityTitle: 'Getting around',
    licence: 'Driving licence',
    car: 'Own vehicle',
    mobilityHint: 'Not required, but a clear advantage in this area.',

    experienceTitle: 'Experience',
    years: 'Years of experience',
    areas: 'Areas',
    areaCleaning: 'Cleaning',
    areaAssembly: 'Furniture assembly',

    availabilityTitle: 'Availability',
    availabilityDays: 'Possible days',
    availabilityFrom: 'From',
    availabilityTo: 'Until',
    startFrom: 'Earliest start',

    referencesTitle: 'References',
    referencesHint: 'We call them. Two is enough.',
    referenceName: 'Name',
    referenceCompany: 'Company',
    referencePhone: 'Phone',
    referenceAdd: 'Add a reference',
    referenceRemove: 'Remove',

    documentsTitle: 'Documents',
    documentsHint: 'Your CV as a PDF. Employer references if you have them.',
    documentsAdd: 'Choose a file',
    documentsEmpty: 'No file chosen yet.',
    documentsRemove: 'Remove',
    documentsDemo: 'Nothing is uploaded in this prototype — the file is only listed.',
    documentsTooLarge: 'This file is larger than 5 MB and was not added.',

    motivation: 'Why Homivaro?',
    motivationHint: 'A few sentences is plenty. No cover letter needed.',

    consentTitle: 'Consent',
    consentLabel:
      'I agree that Homivaro may store my details in order to assess this application.',
    consentRetention:
      'We delete your application automatically after {months} months. You can have it deleted sooner — one message is enough.',

    back: 'Back',
    next: 'Continue',
    submit: 'Send the application',
    required: 'This field is needed.',
    invalidEmail: 'Please check the email address.',
    consentRequired: 'Without consent we cannot accept the application.',
  },

  sent: {
    title: 'Your application has arrived',
    reference: 'Reference number',
    referenceHint: 'Note it down — it is how you check the status.',
    nextTitle: 'What happens now',
    retention: 'Your details are kept until {date} and deleted after that.',
    statusAction: 'Check the status',
    homeAction: 'Back to the homepage',
  },

  status: {
    title: 'Your application status',
    lead: 'Enter your reference number.',
    referenceLabel: 'Reference number',
    referencePlaceholder: 'BW-0031',
    check: 'Check',
    notFoundTitle: 'No application found',
    notFoundBody:
      'Check the number. It is on the confirmation you saw after sending.',
    foundTitle: 'Application {reference}',
    submitted: 'Received on',
    stateNew: 'Your application is with us. We get back to you within five working days.',
    stateInReview: 'We are reviewing your documents and will call you.',
    stateAccepted: 'Welcome to the team. We have sent you the details.',
    stateRejected:
      'It was not a fit this time. Your documents stay with us until the retention period ends — you are welcome to apply again.',
  },
};
