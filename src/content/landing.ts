/**
 * Every string on the approved landing design, in both languages. Copied from
 * the design build verbatim — this page is a clone of it, not an adaptation,
 * so the copy is the design just as much as the type scale is.
 *
 * The one thing that had to change is how a language is chosen. The design
 * build kept it in localStorage; this app routes locales in the URL across
 * four of them, so `landingContent()` takes the routing locale and folds
 * fr and it onto German, which is the fallback the rest of the site already
 * uses (see i18n/request.ts).
 *
 * English is lifted verbatim from the Figma source; German follows Swiss
 * convention (ss, never ß). Section components read this through
 * `useLandingContent()` so they stay about layout and motion only.
 */

export type LandingLocale = "en" | "de";

export type HeadlinePart = { t: string; outline?: boolean };

export type Content = {
  nav: { label: string; href: string }[];
  actions: {
    quote: string;
    pricing: string;
    services: string;
    about: string;
    comparePlans: string;
    startPlan: string;
    chat: string;
    menu: string;
    prev: string;
    next: string;
    pauseServices: string;
    playServices: string;
  };
  hero: {
    headline: HeadlinePart[][];
    sub: string;
    tags: string[];
    badge: { line1: string; line2: string; count: string };
  };
  stats: { value: string; label: string }[];
  services: {
    headline: { red: string; navy: string }[];
    body: string;
    counter: (i: number, n: number) => string;
    items: { name: string; price: string; image: string }[];
  };
  promises: {
    headline: { navy: string; red: string };
    items: { title: string; body: string; featured?: boolean }[];
  };
  cta: { before: string; outline: string; after: string; body: string };
  steps: {
    headline: { navy: string; red: string };
    items: { n: string; title: string; body: string }[];
  };
  coverage: {
    headline: { red: string; navy: string };
    body: string;
    items: { name: string; zip: string }[];
  };
  plans: {
    headline: { navy: string; red: string };
    discountLabel: string;
    items: {
      name: string;
      cadence: string;
      discount: number;
      featured?: boolean;
      ribbon?: string;
      features: string[];
    }[];
  };
  testimonials: {
    eyebrow: string;
    headline: string;
    rating: string;
    items: {
      quote: string;
      lead: string;
      name: string;
      country: string;
      avatar: string;
    }[];
  };
  footer: {
    tagline: string[];
    servicesTitle: string;
    services: string[];
    companyTitle: string;
    company: string[];
    supportTitle: string;
    hours: string;
    social: string;
    copyright: string;
    legal: string[];
    newsletter: string;
    emailPlaceholder: string;
    subscribed: string;
  };
};

export const contact = {
  phone: "+41 44 599 91 36",
  phoneHref: "tel:+41445999136",
  mobile: "076 227 79 66",
  email: "info@homivaro.ch",
} as const;

const serviceImages = [
  "/img/service-1.webp",
  "/img/service-2.webp",
  "/img/service-3.webp",
  "/img/service-1.webp",
  "/img/service-3.webp",
  "/img/service-2.webp",
  "/img/service-1.webp",
];

const zips = ["8700", "8706", "8707", "8708", "8712", "8132", "8627", "8634"];

const englishServiceNames = [
  "Regular cleaning",
  "One-off cleaning",
  "Deep cleaning",
  "Move-out cleaning",
  "Window cleaning",
  "Office cleaning",
  "Furniture assembly",
];

const germanServiceNames = [
  "Unterhaltsreinigung",
  "Einmalreinigung",
  "Grundreinigung",
  "Umzugsreinigung",
  "Fensterreinigung",
  "Büroreinigung",
  "Möbelmontage",
];

const en: Content = {
  nav: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/leistungen" },
    { label: "Pricing", href: "/preise" },
    { label: "Plans", href: "/abos" },
    { label: "Our work", href: "/referenzen" },
    { label: "About us", href: "/ueber-uns" },
    { label: "Contact", href: "/kontakt" },
  ],
  actions: {
    quote: "Request a quote",
    pricing: "See pricing",
    services: "Explore our services",
    about: "Learn more about us",
    comparePlans: "Compare plans",
    startPlan: "Start a plan",
    chat: "Chat with us",
    menu: "Menu",
    prev: "Previous testimonials",
    next: "Next testimonials",
    pauseServices: "Stop the services advancing on their own",
    playServices: "Let the services advance on their own",
  },
  hero: {
    headline: [
      [{ t: "Cleaning and" }],
      [{ t: "assembly," }, { t: "without", outline: true }],
      [{ t: "the back and forth." }],
    ],
    sub: "A fixed rate of CHF 49 an hour. A binding quote within 24 hours. Arrival and departure logged on every job.",
    tags: ["#HandoverGuarantee", "#ARealArrivalWindow", "#TheSameHandsEveryTime"],
    badge: {
      line1: "Use our services and",
      line2: "make your house happy",
      count: "42k+",
    },
  },
  stats: [
    { value: "8", label: "municipalities on the right shore of Lake Zurich" },
    { value: "24H", label: "from request to a binding, line-by-line quote" },
    { value: "CHF 49.", label: "fixed hourly rate, no surprises added later" },
    { value: "1", label: "person to talk to — no agency, no call centre" },
  ],
  services: {
    headline: [
      { red: "Seven services.", navy: "One" },
      { red: "", navy: "request each." },
    ],
    body: "Seven services, one per request. Need two? Send two requests — that keeps every quote honestly costed.",
    counter: (i, n) => `Service ${i} of ${n}`,
    items: englishServiceNames.map((name, i) => ({
      name,
      price: i === 6 ? "from CHF 49.–" : "from CHF 98.–",
      /* Non-null: the list is indexed by the seven service names above, and
         serviceImages has exactly seven entries. */
      image: serviceImages[i]!,
    })),
  },
  promises: {
    headline: { navy: "What you can ", red: "hold us to." },
    items: [
      {
        title: "The price is fixed beforehand",
        body: "Every line itemised. Travel and surcharges appear as their own line in the quote, never folded into a total.",
      },
      {
        title: "Times are logged",
        body: "Arrival and departure are recorded. You can see how long we were there — even when you are not home.",
      },
      {
        title: "Photos, not claims",
        body: "Before and after, every job. We document the difference, so you always know exactly what was done and what you’re getting.",
      },
      {
        title: "Access stays your decision",
        body: "A key, a key box, or you are there. Access details are encrypted and visible only on the day of the job.",
        featured: true,
      },
    ],
  },
  cta: {
    before: "Tell us what",
    outline: "needs",
    after: "doing.",
    body: "Three minutes for the request, a binding quote within 24 hours. Nothing is booked until the price and the slot both work for you.",
  },
  steps: {
    headline: { navy: "Four steps. ", red: "No back and forth." },
    items: [
      {
        n: "1",
        title: "Send a request",
        body: "You describe the property. Takes about three minutes.",
      },
      {
        n: "2",
        title: "Get a quote",
        body: "Within 24 hours, binding, line by line.",
      },
      {
        n: "3",
        title: "Pick a slot",
        body: "You choose from the free slots. Only then is it booked.",
      },
      {
        n: "4",
        title: "We show up",
        body: "With before and after photos and logged times.",
      },
    ],
  },
  coverage: {
    headline: { red: "Eight municipalities", navy: "on the right shore." },
    body: "We work a deliberately tight area. Short distances mean punctual appointments — and no travel charge.",
    items: [
      "Küsnacht",
      "Meilen",
      "Uetikon am See",
      "Männedorf",
      "Stäfa",
      "Egg",
      "Grüningen",
      "Hombrechtikon",
    ].map((name, i) => ({ name, zip: zips[i]! })),
  },
  plans: {
    headline: { navy: "Regular cleaning, ", red: "on repeat." },
    discountLabel: "Discount on every visit",
    items: [
      {
        name: "BASIC",
        cadence: "Every two weeks",
        discount: 10,
        features: [
          "Fixed hourly rate",
          "Move or skip a visit anytime",
          "Same cleaner every visit",
        ],
      },
      {
        name: "PREMIUM",
        cadence: "Weekly",
        discount: 15,
        featured: true,
        ribbon: "For most households",
        features: [
          "Everything in Basic",
          "Priority booking slots",
          "Free re-clean if anything’s missed",
        ],
      },
      {
        name: "VIP",
        cadence: "Twice weekly",
        discount: 20,
        features: [
          "Everything in Premium",
          "Dedicated account contact",
          "Quarterly deep clean included",
        ],
      },
    ],
  },
  testimonials: {
    eyebrow: "Testimonials",
    headline: "Driven by a performance mindset",
    rating: "Based on 200+ reviews",
    items: [
      {
        quote:
          "I'm genuinely impressed with the UI work delivered by Developios. The interface feels modern, intuitive, and exceptionally well thought out. What stood out most is how they transformed complex functionality into a clean, user-friendly design without compromising the brand identity.",
        lead: "I'm genuinely impressed with the UI work delivered by Developios.",
        name: "Mahmoud Bizri",
        country: "Saudi Arabia",
        avatar: "/img/author-1.webp",
      },
      {
        quote:
          "They developed the front end and it looks great and looking forward to working on the back end! They did a great job on UI as well! Faraz and team are very good! Would recommend them for UI and LMS and Design! Continuing to work with them to develop everything so stay tuned!",
        lead: "They developed the front end and it looks great and looking forward to working on the back end!",
        name: "Rick Duran",
        country: "United States",
        avatar: "/img/author-2.webp",
      },
      {
        quote:
          "Faraz was super responsive from day one. He was supposed to integrate with a Notion backend but the Notion backend Fiver disappeared from the job but that did not phase Faraz. He kept going and made it work. I appreciate the responsiveness, the work and the professionalism.",
        lead: "Faraz was super responsive from day one. He was supposed to integrate with a Notion backend but the Notion backend",
        name: "Enyo kumashor",
        country: "Ghana",
        avatar: "/img/author-3.webp",
      },
      {
        quote:
          "The quote arrived the same evening, itemised to the last line. The team turned up inside the arrival window and sent before and after photos before they left. Exactly what was promised, nothing added later.",
        lead: "The quote arrived the same evening, itemised to the last line.",
        name: "Andrea Frei",
        country: "Küsnacht",
        avatar: "/img/review-2.webp",
      },
      {
        quote:
          "We book the weekly plan for a family of five. Same two people every visit, so nothing has to be explained twice. Moving a visit takes one message and there is never a surcharge argument afterwards.",
        lead: "We book the weekly plan for a family of five.",
        name: "Nicolas Weber",
        country: "Stäfa",
        avatar: "/img/review-1.webp",
      },
    ],
  },
  footer: {
    tagline: ["Clean. Reliable.", "Swiss quality."],
    servicesTitle: "Services",
    services: englishServiceNames,
    companyTitle: "Company",
    company: ["About us", "Our work", "Pricing", "Plans", "Jobs", "Contact"],
    supportTitle: "Support",
    hours: "Mon–Sat, 07:00–18:00",
    social: "Social Media",
    copyright: "© 2026 Homivaro. All rights reserved.",
    legal: ["Privacy Policy", "Terms", "Imprint"],
    newsletter: "Subscribe to our Newsletter",
    emailPlaceholder: "Enter your email",
    subscribed: "Subscribed",
  },
};

const de: Content = {
  nav: [
    { label: "Start", href: "/" },
    { label: "Leistungen", href: "/leistungen" },
    { label: "Preise", href: "/preise" },
    { label: "Abos", href: "/abos" },
    { label: "Referenzen", href: "/referenzen" },
    { label: "Über uns", href: "/ueber-uns" },
    { label: "Kontakt", href: "/kontakt" },
  ],
  actions: {
    quote: "Offerte anfordern",
    pricing: "Preise ansehen",
    services: "Leistungen entdecken",
    about: "Mehr über uns",
    comparePlans: "Abos vergleichen",
    startPlan: "Abo starten",
    chat: "Schreiben Sie uns",
    menu: "Menü",
    prev: "Vorherige Kundenstimmen",
    next: "Nächste Kundenstimmen",
    pauseServices: "Automatischen Wechsel der Leistungen anhalten",
    playServices: "Leistungen automatisch weiterblättern",
  },
  hero: {
    headline: [
      [{ t: "Reinigung und" }],
      [{ t: "Montage," }, { t: "ohne", outline: true }],
      [{ t: "das Hin und Her." }],
    ],
    sub: "Ein Fixpreis von CHF 49 pro Stunde. Eine verbindliche Offerte innert 24 Stunden. Ankunft und Abfahrt bei jedem Auftrag protokolliert.",
    tags: ["#Übergabegarantie", "#EchtesAnkunftsfenster", "#ImmerDasGleicheTeam"],
    badge: {
      line1: "Unsere Dienste für",
      line2: "ein glückliches Zuhause",
      count: "42k+",
    },
  },
  stats: [
    { value: "8", label: "Gemeinden am rechten Zürichseeufer" },
    { value: "24 STD.", label: "von der Anfrage bis zur verbindlichen Offerte" },
    { value: "CHF 49.", label: "fixer Stundensatz, keine Zuschläge im Nachhinein" },
    { value: "1", label: "Ansprechperson — keine Agentur, kein Callcenter" },
  ],
  services: {
    headline: [
      { red: "Sieben Leistungen.", navy: "Eine" },
      { red: "", navy: "Anfrage pro Leistung." },
    ],
    body: "Sieben Leistungen, eine pro Anfrage. Brauchen Sie zwei? Senden Sie zwei Anfragen — so bleibt jede Offerte ehrlich kalkuliert.",
    counter: (i, n) => `Leistung ${i} von ${n}`,
    items: germanServiceNames.map((name, i) => ({
      name,
      price: i === 6 ? "ab CHF 49.–" : "ab CHF 98.–",
      /* Non-null: the list is indexed by the seven service names above, and
         serviceImages has exactly seven entries. */
      image: serviceImages[i]!,
    })),
  },
  promises: {
    headline: { navy: "Worauf Sie uns ", red: "behaften können." },
    items: [
      {
        title: "Der Preis steht vorher fest",
        body: "Jede Position einzeln ausgewiesen. Anfahrt und Zuschläge erscheinen als eigene Zeile in der Offerte, nie in einer Pauschale versteckt.",
      },
      {
        title: "Zeiten werden protokolliert",
        body: "Ankunft und Abfahrt werden erfasst. Sie sehen, wie lange wir da waren — auch wenn Sie nicht zu Hause sind.",
      },
      {
        title: "Fotos statt Behauptungen",
        body: "Vorher und nachher, bei jedem Auftrag. Wir dokumentieren den Unterschied, damit Sie immer genau wissen, was gemacht wurde.",
      },
      {
        title: "Der Zugang bleibt Ihre Entscheidung",
        body: "Ein Schlüssel, ein Schlüsselkasten oder Sie sind da. Zugangsdaten sind verschlüsselt und nur am Tag des Auftrags sichtbar.",
        featured: true,
      },
    ],
  },
  cta: {
    before: "Sagen Sie uns,",
    outline: "was",
    after: "zu tun ist.",
    body: "Drei Minuten für die Anfrage, eine verbindliche Offerte innert 24 Stunden. Nichts ist gebucht, bevor Preis und Termin für Sie stimmen.",
  },
  steps: {
    headline: { navy: "Vier Schritte. ", red: "Kein Hin und Her." },
    items: [
      {
        n: "1",
        title: "Anfrage senden",
        body: "Sie beschreiben das Objekt. Dauert etwa drei Minuten.",
      },
      {
        n: "2",
        title: "Offerte erhalten",
        body: "Innert 24 Stunden, verbindlich, Position für Position.",
      },
      {
        n: "3",
        title: "Termin wählen",
        body: "Sie wählen aus den freien Terminen. Erst dann ist gebucht.",
      },
      {
        n: "4",
        title: "Wir kommen",
        body: "Mit Fotos vorher und nachher und protokollierten Zeiten.",
      },
    ],
  },
  coverage: {
    headline: { red: "Acht Gemeinden", navy: "am rechten Seeufer." },
    body: "Wir arbeiten in einem bewusst engen Gebiet. Kurze Wege bedeuten pünktliche Termine — und keine Anfahrtspauschale.",
    items: [
      "Küsnacht",
      "Meilen",
      "Uetikon am See",
      "Männedorf",
      "Stäfa",
      "Egg",
      "Grüningen",
      "Hombrechtikon",
    ].map((name, i) => ({ name, zip: zips[i]! })),
  },
  plans: {
    headline: { navy: "Regelmässige Reinigung, ", red: "im Abo." },
    discountLabel: "Rabatt bei jedem Einsatz",
    items: [
      {
        name: "BASIC",
        cadence: "Alle zwei Wochen",
        discount: 10,
        features: [
          "Fixer Stundensatz",
          "Einsatz jederzeit verschieben oder auslassen",
          "Immer dieselbe Reinigungskraft",
        ],
      },
      {
        name: "PREMIUM",
        cadence: "Wöchentlich",
        discount: 15,
        featured: true,
        ribbon: "Für die meisten Haushalte",
        features: [
          "Alles aus Basic",
          "Bevorzugte Termine",
          "Kostenlose Nachreinigung, falls etwas fehlt",
        ],
      },
      {
        name: "VIP",
        cadence: "Zweimal wöchentlich",
        discount: 20,
        features: [
          "Alles aus Premium",
          "Persönliche Ansprechperson",
          "Vierteljährliche Grundreinigung inklusive",
        ],
      },
    ],
  },
  testimonials: {
    eyebrow: "Kundenstimmen",
    headline: "Angetrieben von Leistungsdenken",
    rating: "Basierend auf 200+ Bewertungen",
    items: [
      {
        quote:
          "Ich bin wirklich beeindruckt von der UI-Arbeit von Developios. Das Interface wirkt modern, intuitiv und aussergewöhnlich durchdacht. Besonders aufgefallen ist mir, wie sie komplexe Funktionalität in ein klares, benutzerfreundliches Design übersetzt haben, ohne die Markenidentität zu verwässern.",
        lead: "Ich bin wirklich beeindruckt von der UI-Arbeit von Developios.",
        name: "Mahmoud Bizri",
        country: "Saudi-Arabien",
        avatar: "/img/author-1.webp",
      },
      {
        quote:
          "Sie haben das Frontend entwickelt und es sieht grossartig aus. Ich freue mich auf die Arbeit am Backend! Auch beim UI haben sie hervorragende Arbeit geleistet. Faraz und sein Team sind sehr gut! Klare Empfehlung für UI, LMS und Design.",
        lead: "Sie haben das Frontend entwickelt und es sieht grossartig aus.",
        name: "Rick Duran",
        country: "Vereinigte Staaten",
        avatar: "/img/author-2.webp",
      },
      {
        quote:
          "Faraz hat vom ersten Tag an sehr schnell reagiert. Eigentlich sollte ein Notion-Backend angebunden werden, doch der zuständige Entwickler verschwand mitten im Projekt. Das hat Faraz nicht aus der Ruhe gebracht. Er hat weitergemacht und es zum Laufen gebracht.",
        lead: "Faraz hat vom ersten Tag an sehr schnell reagiert.",
        name: "Enyo kumashor",
        country: "Ghana",
        avatar: "/img/author-3.webp",
      },
      {
        quote:
          "Die Offerte kam noch am selben Abend, bis zur letzten Position aufgeschlüsselt. Das Team kam innerhalb des Ankunftsfensters und schickte vor dem Gehen Fotos von vorher und nachher. Genau wie versprochen, ohne Nachträge.",
        lead: "Die Offerte kam noch am selben Abend, bis zur letzten Position aufgeschlüsselt.",
        name: "Andrea Frei",
        country: "Küsnacht",
        avatar: "/img/review-2.webp",
      },
      {
        quote:
          "Wir haben das wöchentliche Abo für eine fünfköpfige Familie. Immer dieselben zwei Personen, so muss nichts zweimal erklärt werden. Einen Termin zu verschieben kostet eine Nachricht, und es gibt nie eine Diskussion über Zuschläge.",
        lead: "Wir haben das wöchentliche Abo für eine fünfköpfige Familie.",
        name: "Nicolas Weber",
        country: "Stäfa",
        avatar: "/img/review-1.webp",
      },
    ],
  },
  footer: {
    tagline: ["Sauber. Zuverlässig.", "Schweizer Qualität."],
    servicesTitle: "Leistungen",
    services: germanServiceNames,
    companyTitle: "Unternehmen",
    company: ["Über uns", "Referenzen", "Preise", "Abos", "Jobs", "Kontakt"],
    supportTitle: "Support",
    hours: "Mo–Sa, 07:00–18:00",
    social: "Social Media",
    copyright: "© 2026 Homivaro. Alle Rechte vorbehalten.",
    legal: ["Datenschutz", "AGB", "Impressum"],
    newsletter: "Newsletter abonnieren",
    emailPlaceholder: "E-Mail-Adresse eingeben",
    subscribed: "Abonniert",
  },
};

export const dictionary: Record<LandingLocale, Content> = { en, de };

export const heroAvatars = [1, 2, 3, 4, 5].map((n) => `/img/avatar-${n}.webp`);
export const reviewAvatars = [1, 2, 3, 4].map((n) => `/img/review-${n}.webp`);

/**
 * The copy for a routing locale.
 *
 * French and Italian are declared in `routing.ts` but untranslated, and §20.6
 * requires German as their fallback — the same rule `DICTIONARIES` applies to
 * the message files.
 */
export function landingContent(locale: string): Content {
  return locale === 'en' ? dictionary.en : dictionary.de;
}
