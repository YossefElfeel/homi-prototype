import { Banknote, CreditCard, QrCode, Smartphone } from 'lucide-react';

import type { ID, Payment, PaymentMethod, SavedMethodKind } from '@/mock/schema';

/**
 * One glyph and one label per way of paying, in one place.
 *
 * The same four methods were drawn three times — the account's saved-methods
 * screen picked its own icons, the quote's payment step picked its own again,
 * and the quote list printed a label out of `admin.offers.method`, a fourth
 * copy of the same six words living inside one screen's namespace. Adding
 * `qr-bill` and `cash` to the union would have meant finding all four.
 *
 * Labels are not here: they are translated, and `status.method` is where the
 * dictionary keeps them, next to `status.payment` which already did this for
 * payment *states*. This file owns the parts a dictionary cannot carry — the
 * icon, and which methods are offered where.
 */
export const METHOD_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  card: CreditCard,
  twint: Smartphone,
  'apple-pay': Smartphone,
  'google-pay': Smartphone,
  'qr-bill': QrCode,
  cash: Banknote,
};

/** What a customer can keep on file (screen 45, and the owner's copy on 65). */
export const SAVABLE_METHODS: readonly SavedMethodKind[] = [
  'card',
  'twint',
  'apple-pay',
  'google-pay',
];

/**
 * The brand, off the first digit — the same rule every checkout uses.
 *
 * Here rather than in the dialog because it decides what gets *stored*: the
 * saved label is "Visa · 4242" and nothing else, so this is the one place that
 * ever looks at a card number, and it looks at one character of it.
 */
export function cardBrand(number: string): string {
  const digits = number.replace(/\D/g, '');
  if (digits.startsWith('4')) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  return 'Karte';
}

/** The last four, which is the whole of what a saved card may be identified by. */
export function cardLastFour(number: string): string {
  return number.replace(/\D/g, '').slice(-4);
}

/**
 * What the owner can pick when marking an invoice paid.
 *
 * Apple Pay and Google Pay are absent on purpose: both are card rails the
 * customer taps in a checkout, and neither is something an invoice gets
 * settled with after the fact. Offering them here would invite a record of a
 * payment that could not have happened that way.
 */
export const INVOICE_METHODS: readonly PaymentMethod[] = ['qr-bill', 'twint', 'card', 'cash'];

/**
 * How a supplier's bill gets settled — and it is the same four, deliberately
 * aliased rather than retyped.
 *
 * A wholesaler's invoice arrives with an Einzahlungsschein, the van is paid at
 * the pump with the business card, and the Landi run is cash. Apple Pay and
 * Google Pay are out for exactly the reason they are out above: they are
 * checkout rails, not ways a bill is paid after the fact. If the four ever
 * diverge this becomes its own list, and the point is that today they have not.
 */
export const EXPENSE_METHODS = INVOICE_METHODS;

/**
 * The payment that settled this invoice.
 *
 * Latest wins, for the same reason `offerPayment` does it: a retry after a
 * failed attempt leaves both on the record, and the first one would report a
 * paid invoice as unpaid.
 */
export function invoicePayment(invoiceId: ID, payments: Payment[]): Payment | undefined {
  return payments
    .filter((p) => p.invoiceId === invoiceId)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
}

/* ------------------------------------------------- putting one on file (45) */

/**
 * Everything a customer types to save a method, before most of it is discarded.
 *
 * Screen 45 asked for none of it. The four buttons under «Hinzufügen» wrote a
 * record on the click, labelled with the name of the method — so saving a card
 * produced «Karte», saving a second one produced «Karte» again, and the list
 * whose whole subject is *which* instruments we hold could not tell two of them
 * apart. Nothing was collected, so nothing could be shown: the plan card had no
 * expiry to warn on and the TWINT row no number to recognise.
 *
 * One draft covers all four kinds rather than a union per kind, because the
 * form is one dialog that switches its fields — the admin's copy (65) even
 * keeps a kind selector above them, and re-keying the state on every change of
 * that selector would throw away a half-typed number the moment somebody
 * checked what else was in the list.
 */
export interface PaymentDraft {
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  /** TWINT is registered to a mobile number; that is the whole of its identity. */
  phone: string;
  /** Which device the wallet was confirmed on — see `WALLET_DEVICES`. */
  device: string;
}

export type WalletKind = 'apple-pay' | 'google-pay';

export function isWalletKind(kind: SavedMethodKind): kind is WalletKind {
  return kind === 'apple-pay' || kind === 'google-pay';
}

/**
 * The wallets ask for a device, and that is not a stand-in for a card form.
 *
 * Apple Pay and Google Pay never take a number: the sheet on the device does
 * the choosing and the authenticating, and what comes back is a token bound to
 * *that* device. So the one fact worth keeping is which device it was — which
 * is exactly what the seed already labels (`Apple Pay · iPhone`) and the only
 * thing that separates a customer's two wallet entries.
 *
 * A list rather than a text field because these are product names, not
 * something to be typed and mistyped, and it keeps the label out of the reach
 * of a locale: every entry here is a proper noun in all four.
 */
export const WALLET_DEVICES: Record<WalletKind, readonly string[]> = {
  'apple-pay': ['iPhone', 'iPad', 'Mac', 'Apple Watch'],
  'google-pay': ['Android', 'Chrome', 'Wear OS'],
};

const WALLET_BRAND: Record<WalletKind, string> = {
  'apple-pay': 'Apple Pay',
  'google-pay': 'Google Pay',
};

export function blankDraft(kind: SavedMethodKind): PaymentDraft {
  return {
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    phone: '',
    /* Pre-picked, because the wallet form is one control and an empty select
       would make «Bestätigen» look disabled for no stated reason. */
    device: isWalletKind(kind) ? WALLET_DEVICES[kind][0]! : '',
  };
}

/** Groups the digits in fours as they are typed. A 16-digit run read off a card
    over the phone is unreadable back, and this is the field most often retyped. */
export function formatCardNumber(input: string): string {
  return input
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Puts the slash in, and only once there is something after it — otherwise
    backspacing through «09/» would restore the slash the customer just deleted
    and the field could never be emptied. */
export function formatCardExpiry(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** A month, then a year. `13/28` used to pass — the admin's dialog checked only
    that two digits stood either side of the slash. */
export function cardExpiryValid(value: string): boolean {
  return /^(0[1-9]|1[0-2])\/\d{2}$/.test(value);
}

/** Thirteen to nineteen digits covers every brand `cardBrand` can name; below
    that `cardLastFour` would happily cut four digits out of a phone number. */
export function cardNumberValid(value: string): boolean {
  return /^\d{13,19}$/.test(value.replace(/\D/g, ''));
}

/**
 * The Swiss mobile number as ten digits, however it was written.
 *
 * `+41 79`, `0041 79` and `079` are one number typed three ways, and the label
 * is cut out of a fixed position — so they have to agree before anything reads
 * an index into them.
 */
export function twintDigits(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('0041')) return `0${digits.slice(4)}`;
  if (digits.startsWith('41')) return `0${digits.slice(2)}`;
  return digits;
}

export function twintValid(input: string): boolean {
  return /^07[5-9]\d{7}$/.test(twintDigits(input));
}

/** "TWINT · 079 ··· 66" — the operator prefix and the last two digits, which is
    the shape the seed labels one with and as much of a number as a saved method
    may carry. */
export function twintLabel(input: string): string {
  const digits = twintDigits(input);
  return `TWINT · ${digits.slice(0, 3)} ··· ${digits.slice(-2)}`;
}

/** Whether the draft is finished enough to save. Per kind, because the four
    have nothing in common but the button underneath them. */
export function methodDraftReady(kind: SavedMethodKind, draft: PaymentDraft): boolean {
  switch (kind) {
    case 'card':
      return (
        cardNumberValid(draft.cardNumber) &&
        draft.cardName.trim().length > 0 &&
        cardExpiryValid(draft.cardExpiry) &&
        /^\d{3,4}$/.test(draft.cardCvv)
      );
    case 'twint':
      return twintValid(draft.phone);
    default:
      return draft.device.trim().length > 0;
  }
}

/**
 * What survives the save — and this function is the whole reason the draft is
 * not the record.
 *
 * A card leaves behind its brand, its last four and its expiry. The number, the
 * name and the security code are read here and go no further: `SavedPaymentMethod`
 * has nowhere to put them, and a prototype that models a stored PAN is one
 * somebody builds for real.
 */
export function methodDraftRecord(
  kind: SavedMethodKind,
  draft: PaymentDraft,
): { label: string; expiresAt?: string } {
  switch (kind) {
    case 'card':
      return {
        label: `${cardBrand(draft.cardNumber)} · ${cardLastFour(draft.cardNumber)}`,
        expiresAt: draft.cardExpiry,
      };
    case 'twint':
      return { label: twintLabel(draft.phone) };
    default:
      return { label: `${WALLET_BRAND[kind]} · ${draft.device}` };
  }
}
