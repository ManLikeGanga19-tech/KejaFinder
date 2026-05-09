import { describe, it, expect } from 'vitest';
import {
  projectListingForUser,
  jitterCoordinates,
  containsSensitiveFields,
  SENSITIVE_FIELDS_REQUIRING_UNLOCK,
  type ListingFull,
} from '../../src/lib/lock-unlock.js';

const fullListing: ListingFull = {
  id: 'l1',
  slug: 'apt-kilimani',
  title: '2BR Apartment in Kilimani',
  descriptionFull: 'Spacious top-floor apartment with city skyline views, modern kitchen with quartz countertops, walk-in closet.',
  descriptionTeaser: 'Spacious top-floor apartment with city skyline views, modern kitchen...',
  propertyType: 'apartment',
  priceKes: 65000,
  bedrooms: 2,
  bathrooms: 2,
  city: 'Nairobi',
  address: 'Argwings Kodhek Rd, Apt 4B, Kilimani',
  coordinates: { lat: -1.2921, lng: 36.7860 },
  caretakerName: 'Jane Wanjiru',
  caretakerPhone: '+254722000111',
  unlockPriceKes: 499,
  agent: {
    id: 'a1',
    displayName: 'Premium Realty',
    companyName: 'Premium Realty Ltd',
    logoUrl: 'https://example.com/logo.png',
    phone: '+254700123456',
    email: 'agent@premium.co.ke',
  },
};

describe('projectListingForUser — locked view', () => {
  const view = projectListingForUser(fullListing, false);

  it('marks isLocked=true and isUnlockedByMe=false', () => {
    expect(view.isLocked).toBe(true);
    expect(view.isUnlockedByMe).toBe(false);
  });

  it('returns id, slug, title, teaser, type, price, beds, baths, city, unlockPrice', () => {
    expect(view.id).toBe('l1');
    expect(view.slug).toBe('apt-kilimani');
    expect(view.title).toBe('2BR Apartment in Kilimani');
    expect((view as any).descriptionTeaser).toBe(fullListing.descriptionTeaser);
    expect(view.propertyType).toBe('apartment');
    expect(view.priceKes).toBe(65000);
    expect(view.bedrooms).toBe(2);
    expect(view.bathrooms).toBe(2);
    expect(view.city).toBe('Nairobi');
    expect(view.unlockPriceKes).toBe(499);
  });

  it('returns ONLY public agent fields (no phone/email)', () => {
    expect(view.agent.id).toBe('a1');
    expect(view.agent.displayName).toBe('Premium Realty');
    expect(view.agent.companyName).toBe('Premium Realty Ltd');
    expect(view.agent.logoUrl).toBe('https://example.com/logo.png');
    expect((view.agent as any).phone).toBeUndefined();
    expect((view.agent as any).email).toBeUndefined();
  });

  it('NEVER leaks address', () => {
    expect((view as any).address).toBeUndefined();
  });

  it('NEVER leaks exact coordinates (only approxCoordinates)', () => {
    expect((view as any).coordinates).toBeUndefined();
    expect((view as any).approxCoordinates).toBeDefined();
  });

  it('NEVER leaks caretaker fields', () => {
    expect((view as any).caretakerName).toBeUndefined();
    expect((view as any).caretakerPhone).toBeUndefined();
  });

  it('NEVER leaks descriptionFull', () => {
    expect((view as any).descriptionFull).toBeUndefined();
  });

  it('passes the sensitive-fields invariant', () => {
    expect(containsSensitiveFields(view)).toBe(false);
  });

  it('handles null coordinates gracefully', () => {
    const v = projectListingForUser({ ...fullListing, coordinates: null }, false);
    expect((v as any).approxCoordinates).toBeNull();
  });
});

describe('projectListingForUser — unlocked view', () => {
  const view = projectListingForUser(fullListing, true);

  it('marks isLocked=false and isUnlockedByMe=true', () => {
    expect(view.isLocked).toBe(false);
    expect(view.isUnlockedByMe).toBe(true);
  });

  it('returns full description', () => {
    expect((view as any).descriptionFull).toBe(fullListing.descriptionFull);
  });

  it('returns exact address', () => {
    expect((view as any).address).toBe(fullListing.address);
  });

  it('returns exact coordinates (not approximated)', () => {
    expect((view as any).coordinates).toEqual(fullListing.coordinates);
  });

  it('returns caretaker name and phone', () => {
    expect((view as any).caretakerName).toBe('Jane Wanjiru');
    expect((view as any).caretakerPhone).toBe('+254722000111');
  });

  it('returns agent phone and email', () => {
    expect((view as any).agent.phone).toBe('+254700123456');
    expect((view as any).agent.email).toBe('agent@premium.co.ke');
  });
});

describe('jitterCoordinates', () => {
  it('returns null when input is null', () => {
    expect(jitterCoordinates(null, 200)).toBeNull();
  });

  it('keeps result within ±200m radius (using deterministic random)', () => {
    const noJitter = jitterCoordinates({ lat: -1.2921, lng: 36.7860 }, 200, () => 0.5);
    expect(noJitter!.lat).toBeCloseTo(-1.2921, 6);
    expect(noJitter!.lng).toBeCloseTo(36.7860, 6);
  });

  it('produces different results across calls (randomness)', () => {
    const a = jitterCoordinates({ lat: -1.2921, lng: 36.7860 }, 200);
    const b = jitterCoordinates({ lat: -1.2921, lng: 36.7860 }, 200);
    expect(a).not.toEqual(b);
  });

  it('jitter does not exceed expected radius', () => {
    const max = jitterCoordinates({ lat: 0, lng: 0 }, 200, () => 1);
    const min = jitterCoordinates({ lat: 0, lng: 0 }, 200, () => 0);
    expect(Math.abs(max!.lat)).toBeLessThan(0.0018 + 0.0001);
    expect(Math.abs(min!.lat)).toBeLessThan(0.0018 + 0.0001);
  });
});

describe('containsSensitiveFields', () => {
  it('detects address leak', () => {
    expect(containsSensitiveFields({ address: 'leaked' })).toBe(true);
  });

  it('detects coordinates leak', () => {
    expect(containsSensitiveFields({ coordinates: { lat: 0, lng: 0 } })).toBe(true);
  });

  it('detects caretaker leak', () => {
    expect(containsSensitiveFields({ caretakerName: 'leaked' })).toBe(true);
    expect(containsSensitiveFields({ caretakerPhone: '+254700' })).toBe(true);
  });

  it('returns false for safe object', () => {
    expect(containsSensitiveFields({ id: '1', title: 'Safe' })).toBe(false);
  });

  it('returns false when sensitive fields are explicitly null', () => {
    expect(containsSensitiveFields({ address: null, coordinates: null })).toBe(false);
  });

  it('SENSITIVE_FIELDS list is non-empty', () => {
    expect(SENSITIVE_FIELDS_REQUIRING_UNLOCK.length).toBeGreaterThan(0);
  });
});
