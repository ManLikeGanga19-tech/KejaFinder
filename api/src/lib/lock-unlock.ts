/**
 * Lock/unlock domain logic for listings.
 *
 * The freemium model: users browse free, see listing previews. To see exact
 * address, agent contacts, and full description they must pay KES 499 via
 * M-Pesa. After successful payment, an `unlocks` row is inserted, and the
 * listing service returns the full record.
 *
 * This module contains the pure decision logic — no DB access, no Fastify.
 * It can be unit-tested in complete isolation and reused by services, route
 * handlers, and integration tests.
 */

export interface ListingFull {
  id: string;
  slug: string;
  title: string;
  descriptionFull: string;
  descriptionTeaser: string;
  propertyType: string;
  priceKes: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  address: string;
  coordinates: { lat: number; lng: number } | null;
  caretakerName: string | null;
  caretakerPhone: string | null;
  unlockPriceKes: number;
  agent: {
    id: string;
    displayName: string;
    companyName?: string | null;
    logoUrl?: string | null;
    phone: string;
    email: string;
  };
  [key: string]: unknown;
}

export interface ListingLockedView {
  id: string;
  slug: string;
  title: string;
  descriptionTeaser: string;
  propertyType: string;
  priceKes: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  approxCoordinates: { lat: number; lng: number } | null;
  unlockPriceKes: number;
  agent: {
    id: string;
    displayName: string;
    companyName?: string | null;
    logoUrl?: string | null;
  };
  isLocked: true;
  isUnlockedByMe: false;
}

export interface ListingUnlockedView extends ListingFull {
  isLocked: false;
  isUnlockedByMe: true;
}

export type ListingResponseView = ListingLockedView | ListingUnlockedView;

/**
 * Project a full listing into either the locked (preview) or unlocked (full)
 * view based on whether the requesting user has paid.
 *
 * SAFETY-CRITICAL: this is the only function that decides what fields to
 * return. Bugs here leak agent contacts. Test rigorously.
 */
export function projectListingForUser(
  listing: ListingFull,
  isUnlockedByMe: boolean,
): ListingResponseView {
  if (isUnlockedByMe) {
    return {
      ...listing,
      isLocked: false,
      isUnlockedByMe: true,
    };
  }

  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    descriptionTeaser: listing.descriptionTeaser,
    propertyType: listing.propertyType,
    priceKes: listing.priceKes,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    city: listing.city,
    approxCoordinates: jitterCoordinates(listing.coordinates, 200),
    unlockPriceKes: listing.unlockPriceKes,
    agent: {
      id: listing.agent.id,
      displayName: listing.agent.displayName,
      companyName: listing.agent.companyName,
      logoUrl: listing.agent.logoUrl,
    },
    isLocked: true,
    isUnlockedByMe: false,
  };
}

/**
 * Add ±N meters of random noise to coordinates so map pins don't reveal
 * exact addresses to non-paying users. Returns null if input is null.
 *
 * 1° latitude ≈ 111 km. Max jitter in degrees = meters / 111000.
 */
export function jitterCoordinates(
  coords: { lat: number; lng: number } | null,
  meters: number,
  random: () => number = Math.random,
): { lat: number; lng: number } | null {
  if (!coords) return null;
  const maxDelta = meters / 111000;
  const dLat = (random() - 0.5) * 2 * maxDelta;
  const dLng = ((random() - 0.5) * 2 * maxDelta) / Math.cos((coords.lat * Math.PI) / 180);
  return {
    lat: coords.lat + dLat,
    lng: coords.lng + dLng,
  };
}

export const SENSITIVE_FIELDS_REQUIRING_UNLOCK = [
  'address',
  'coordinates',
  'caretakerName',
  'caretakerPhone',
  'descriptionFull',
] as const;

export function containsSensitiveFields(view: object): boolean {
  return SENSITIVE_FIELDS_REQUIRING_UNLOCK.some(
    (field) => field in view && (view as Record<string, unknown>)[field] != null,
  );
}
