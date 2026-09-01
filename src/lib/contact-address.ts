import type { ContactAddress } from '@/mock/schema';

/** What the two customer forms hold while it is being typed. */
export interface AddressDraft {
  street: string;
  addressDetail: string;
  postcode: string;
  city: string;
}

export const EMPTY_ADDRESS: AddressDraft = {
  street: '',
  addressDetail: '',
  postcode: '',
  city: '',
};

/** A stored address back into the shape the form fields bind to. */
export function toDraft(address: ContactAddress | undefined): AddressDraft {
  return {
    street: address?.street ?? '',
    addressDetail: address?.addressDetail ?? '',
    postcode: address?.postcode ?? '',
    city: address?.city ?? '',
  };
}

/**
 * A typed-in address, or nothing at all.
 *
 * Returns `undefined` for a form nobody filled in, so «no address on file» is
 * an absent field rather than a record of four empty strings. The detail
 * screen tests the address for truthiness before it renders the block, and a
 * present-but-blank object would draw an address card with nothing in it.
 *
 * A street is what makes it an address. The postcode alone identifies a
 * municipality, not a place to send anything, so it is not enough on its own.
 */
export function normaliseAddress(
  draft: AddressDraft | ContactAddress | undefined,
): ContactAddress | undefined {
  if (!draft) return undefined;

  const street = draft.street.trim();
  const postcode = draft.postcode.trim();
  const city = draft.city.trim();
  if (!street) return undefined;

  return {
    street,
    addressDetail: draft.addressDetail?.trim() || undefined,
    postcode,
    city,
  };
}

/** «Seestrasse 14, 8706 Meilen» — one line, skipping whatever is missing. */
export function formatAddress(address: ContactAddress): string {
  return [address.street, [address.postcode, address.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
}
