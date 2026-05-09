import { randomUUID } from 'crypto';

let counter = 0;
const seq = () => ++counter;

export const factories = {
  user: (overrides: Partial<UserRow> = {}): UserRow => ({
    id: overrides.id ?? randomUUID(),
    firebase_uid: overrides.firebase_uid ?? `firebase_${seq()}`,
    name: overrides.name ?? 'James Waweru',
    email: overrides.email ?? `user${seq()}@example.com`,
    phone: overrides.phone ?? `+25471${String(seq()).padStart(7, '0')}`,
    role: overrides.role ?? 'consumer',
    avatar_url: overrides.avatar_url ?? null,
    email_verified: overrides.email_verified ?? true,
    phone_verified: overrides.phone_verified ?? true,
    is_active: overrides.is_active ?? true,
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
  }),

  listing: (overrides: Partial<ListingRow> = {}): ListingRow => ({
    id: overrides.id ?? randomUUID(),
    slug: overrides.slug ?? `listing-${seq()}`,
    agent_id: overrides.agent_id ?? randomUUID(),
    area_id: overrides.area_id ?? randomUUID(),
    title: overrides.title ?? '2 Bedroom Apartment in Kilimani',
    description_full: overrides.description_full ?? 'Spacious modern apartment with great city views.',
    description_teaser: overrides.description_teaser ?? 'Spacious modern apartment...',
    property_type: overrides.property_type ?? 'apartment',
    price_kes: overrides.price_kes ?? 65000,
    price_period: overrides.price_period ?? 'monthly',
    bedrooms: overrides.bedrooms ?? 2,
    bathrooms: overrides.bathrooms ?? 2,
    address: overrides.address ?? 'Argwings Kodhek Rd, Kilimani',
    city: overrides.city ?? 'Nairobi',
    unlock_price_kes: overrides.unlock_price_kes ?? 499,
    is_verified: overrides.is_verified ?? true,
    is_featured: overrides.is_featured ?? false,
    status: overrides.status ?? 'active',
    view_count: overrides.view_count ?? 0,
    unlock_count: overrides.unlock_count ?? 0,
  }),

  payment: (overrides: Partial<PaymentRow> = {}): PaymentRow => ({
    id: overrides.id ?? randomUUID(),
    user_id: overrides.user_id ?? randomUUID(),
    listing_id: overrides.listing_id ?? randomUUID(),
    payment_type: overrides.payment_type ?? 'unlock',
    status: overrides.status ?? 'pending',
    amount_kes: overrides.amount_kes ?? 499,
    mpesa_phone: overrides.mpesa_phone ?? '+254712345678',
    idempotency_key: overrides.idempotency_key ?? randomUUID(),
    checkout_request_id: overrides.checkout_request_id ?? `ws_CO_${Date.now()}`,
    created_at: overrides.created_at ?? new Date().toISOString(),
  }),

  area: (overrides: Partial<AreaRow> = {}): AreaRow => ({
    id: overrides.id ?? randomUUID(),
    slug: overrides.slug ?? `area-${seq()}`,
    name: overrides.name ?? 'Kilimani',
    city: overrides.city ?? 'Nairobi',
    safety_rating: overrides.safety_rating ?? 82,
    cost_tier: overrides.cost_tier ?? '$$$',
    rent_range_min: overrides.rent_range_min ?? 50000,
    rent_range_max: overrides.rent_range_max ?? 120000,
  }),
};

export type UserRow = {
  id: string;
  firebase_uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'consumer' | 'agent' | 'admin';
  avatar_url: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ListingRow = {
  id: string;
  slug: string;
  agent_id: string;
  area_id: string;
  title: string;
  description_full: string;
  description_teaser: string;
  property_type: string;
  price_kes: number;
  price_period: string;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  unlock_price_kes: number;
  is_verified: boolean;
  is_featured: boolean;
  status: string;
  view_count: number;
  unlock_count: number;
};

export type PaymentRow = {
  id: string;
  user_id: string;
  listing_id: string;
  payment_type: string;
  status: string;
  amount_kes: number;
  mpesa_phone: string;
  idempotency_key: string;
  checkout_request_id: string;
  created_at: string;
};

export type AreaRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  safety_rating: number;
  cost_tier: string;
  rent_range_min: number;
  rent_range_max: number;
};
