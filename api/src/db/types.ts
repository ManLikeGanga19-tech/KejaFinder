/**
 * Hand-written TypeScript types for database rows.
 * postgres.js transforms snake_case columns to camelCase in JS,
 * so these types use camelCase.
 */

export type UserRole = 'consumer' | 'agent' | 'admin';
export type KycStatus = 'not_submitted' | 'pending_review' | 'approved' | 'rejected';
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'inactive' | 'rejected' | 'archived';
export type PropertyType = 'apartment' | 'house' | 'studio' | 'penthouse' | 'villa' | 'townhouse' | 'bedsitter';
export type Furnishing = 'furnished' | 'semi_furnished' | 'unfurnished';
export type PaymentType = 'unlock' | 'booking' | 'agent_subscription';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'timeout' | 'refunded';
export type AmenityCategory = 'healthcare' | 'education' | 'retail' | 'transport' | 'recreation' | 'finance' | 'dining';
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

export interface UserRow {
  id: string;
  firebaseUid: string | null;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface AgentRow {
  id: string;
  userId: string;
  displayName: string;
  companyName: string | null;
  bio: string | null;
  logoUrl: string | null;
  licenseNumber: string | null;
  nationalId: string | null;
  kycStatus: KycStatus;
  kycVerifiedAt: Date | null;
  kycRejectedReason: string | null;
  isActive: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: Date | null;
  totalLeads: number;
  totalViews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingRow {
  id: string;
  slug: string;
  agentId: string;
  areaId: string | null;
  title: string;
  descriptionFull: string;
  descriptionTeaser: string | null;
  propertyType: PropertyType;
  priceKes: number;
  pricePeriod: string;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number | null;
  floor: number | null;
  totalFloors: number | null;
  furnishing: Furnishing;
  parking: number;
  petsAllowed: boolean;
  wifi: boolean;
  amenities: string[];
  city: string;
  address: string | null;
  caretakerName: string | null;
  caretakerPhone: string | null;
  availableFrom: Date | null;
  depositMonths: number;
  unlockPriceKes: number;
  isVerified: boolean;
  isFeatured: boolean;
  status: ListingStatus;
  moderationNote: string | null;
  rejectedReason: string | null;
  approvedAt: Date | null;
  publishedAt: Date | null;
  viewCount: number;
  unlockCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AreaRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  tags: string[];
  heroImageUrl: string | null;
  localInsight: string | null;
  areaScore: number;
  safetyRating: number;
  safetyLabel: string | null;
  safetyNotes: string | null;
  costTier: string | null;
  rentRangeMin: number | null;
  rentRangeMax: number | null;
  mobilityScore: number | null;
  walkabilityScore: number | null;
  connectivityMins: number | null;
  connectivityRoute: string | null;
  investmentGrowthPct: number | null;
  rentalYieldPct: number | null;
  demandScore: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRow {
  id: string;
  userId: string;
  listingId: string | null;
  paymentType: PaymentType;
  status: PaymentStatus;
  amountKes: number;
  merchantRequestId: string | null;
  checkoutRequestId: string | null;
  mpesaReceiptNumber: string | null;
  mpesaPhone: string;
  resultCode: number | null;
  resultDesc: string | null;
  transactionDate: Date | null;
  failureReason: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnlockRow {
  id: string;
  userId: string;
  listingId: string;
  paymentId: string;
  unlockedAt: Date;
}

export interface LeadRow {
  id: string;
  userId: string;
  listingId: string;
  agentId: string;
  paymentType: PaymentType;
  agentNotes: string | null;
  contacted: boolean;
  contactedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRow {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: Date | null;
  createdAt: Date;
}
