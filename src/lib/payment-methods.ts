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
