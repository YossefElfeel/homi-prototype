'use client';

import { useTranslations } from 'next-intl';

import { Field, Input, Select } from '@/components/ui/field';
import {
  WALLET_DEVICES,
  cardExpiryValid,
  cardNumberValid,
  formatCardExpiry,
  formatCardNumber,
  isWalletKind,
  twintValid,
  type PaymentDraft,
} from '@/lib/payment-methods';
import type { SavedMethodKind } from '@/mock/schema';

/**
 * The fields a method is put on file with, once for both screens that do it.
 *
 * Two screens save a payment method — the customer's own (45) and the owner's
 * copy on the customer record (65) — and until now they disagreed about what
 * saving one means. 45 asked nothing at all: the four buttons wrote a record on
 * the click, labelled with the name of the method, so «Karte» was the whole of
 * what a saved card said. 65 asked for four card fields and, for everything
 * else, a free-text «Bezeichnung» with a hint telling the owner to type
 * «Visa · 4242» themselves — the shape of the record leaking into the form, on
 * the one field where a slip becomes the customer's own screen.
 *
 * So the form lives here and the two screens supply only the frame around it.
 * The rules it enforces — what a valid number is, what the label is cut down to
 * — are in `lib/payment-methods.ts` beside `cardBrand`, because they decide what
 * gets *stored* and the storing is not this component's business.
 *
 * Errors appear once a field has something wrong in it, never while it is still
 * being filled: a card number is invalid for its first fifteen digits, and a
 * form that says so from the first keystroke has taught the reader to ignore it
 * by the last.
 */
export function PaymentMethodFields({
  kind,
  draft,
  onChange,
  namePlaceholder,
}: {
  kind: SavedMethodKind;
  draft: PaymentDraft;
  onChange: (next: PaymentDraft) => void;
  /** The account holder, when the calling screen knows who it is — the name on
      the card is nearly always theirs, and typing it again is a step. */
  namePlaceholder?: string;
}) {
  const t = useTranslations('paymentForm');

  function patch(next: Partial<PaymentDraft>) {
    onChange({ ...draft, ...next });
  }

  if (kind === 'card') {
    return (
      <div className="space-y-4">
        <Field
          label={t('cardNumber')}
          error={
            draft.cardNumber !== '' && !cardNumberValid(draft.cardNumber)
              ? t('cardNumberError')
              : undefined
          }
        >
          {(props) => (
            <Input
              {...props}
              data-numeric
              inputMode="numeric"
              /* Never offer to fill or remember this one. The value is read,
                 cut down to four digits and dropped — putting it in the
                 browser's card store would outlive the record we do keep. */
              autoComplete="off"
              maxLength={23}
              value={draft.cardNumber}
              onChange={(e) => patch({ cardNumber: formatCardNumber(e.target.value) })}
              placeholder="4242 4242 4242 4242"
            />
          )}
        </Field>

        <Field label={t('cardName')}>
          {(props) => (
            <Input
              {...props}
              autoComplete="off"
              value={draft.cardName}
              onChange={(e) => patch({ cardName: e.target.value })}
              placeholder={namePlaceholder}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('cardExpiry')}
            hint={t('cardExpiryHint')}
            error={
              draft.cardExpiry.length === 5 && !cardExpiryValid(draft.cardExpiry)
                ? t('cardExpiryError')
                : undefined
            }
          >
            {(props) => (
              <Input
                {...props}
                data-numeric
                inputMode="numeric"
                autoComplete="off"
                maxLength={5}
                value={draft.cardExpiry}
                onChange={(e) => patch({ cardExpiry: formatCardExpiry(e.target.value) })}
                placeholder="09/28"
              />
            )}
          </Field>
          <Field label={t('cardCvv')} hint={t('cardCvvHint')}>
            {(props) => (
              <Input
                {...props}
                data-numeric
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={draft.cardCvv}
                onChange={(e) => patch({ cardCvv: e.target.value.replace(/\D/g, '') })}
                placeholder="123"
              />
            )}
          </Field>
        </div>

        <StorageNote>{t('cardStorage')}</StorageNote>
      </div>
    );
  }

  if (kind === 'twint') {
    return (
      <div className="space-y-4">
        <Field
          label={t('twintPhone')}
          hint={t('twintPhoneHint')}
          error={draft.phone !== '' && !twintValid(draft.phone) ? t('twintPhoneError') : undefined}
        >
          {(props) => (
            <Input
              {...props}
              data-numeric
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={draft.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder="079 123 45 66"
            />
          )}
        </Field>
        {/* The rule that decides whether this method can carry the plan, said
            where TWINT is being chosen. It is on the screen already, in the
            «Für das Abo» card — but that card explains a state the customer is
            already in, and this is the moment they walk into it. */}
        <StorageNote>{t('twintStorage')}</StorageNote>
      </div>
    );
  }

  /* Apple Pay and Google Pay. Nothing is typed, because in the real product
     nothing is: the sheet on the device picks the card and authenticates it,
     and the token that comes back belongs to that device. The device is
     therefore the only fact worth keeping — and the only thing that tells two
     of a customer's wallet entries apart. */
  const devices = isWalletKind(kind) ? WALLET_DEVICES[kind] : [];

  return (
    <div className="space-y-4">
      <Field label={t('walletDevice')} hint={t('walletDeviceHint')}>
        {(props) => (
          <Select
            {...props}
            value={draft.device}
            onChange={(e) => patch({ device: e.target.value })}
          >
            {devices.map((device) => (
              <option key={device} value={device}>
                {device}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <StorageNote>{t('walletStorage')}</StorageNote>
    </div>
  );
}

/** What survives the save, on the form that collects it. Somebody reading a
    card number into a box is entitled to know which parts of it we keep — and
    on the wallets it is the only place the prototype admits it is standing in
    for a sheet it cannot open. */
function StorageNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-sm)] bg-sunken p-3 text-xs text-ink-tertiary">
      {children}
    </p>
  );
}
