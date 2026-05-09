import type { FastifyInstance } from 'fastify';

interface SearchParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  verified?: boolean;
  areaSlug?: string;
  q?: string;
  sortBy?: string;
  page: number;
  limit: number;
  userId?: string;
}

export async function searchListings(fastify: FastifyInstance, params: SearchParams) {
  const { page, limit, userId, lat, lng, radiusKm, minPrice, maxPrice, bedrooms, propertyType, verified, areaSlug, q } = params;
  const offset = (page - 1) * limit;
  const radiusMeters = radiusKm ? radiusKm * 1000 : null;

  const listings = await fastify.sql`
    SELECT
      l.id, l.slug, l.title, l.price_kes, l.price_period,
      l.property_type, l.bedrooms, l.bathrooms, l.area_sqft,
      l.is_verified, l.is_featured, l.view_count, l.unlock_count, l.published_at,
      l.unlock_price_kes, l.city,
      a.name AS area_name, a.slug AS area_slug,
      ${userId ? fastify.sql`EXISTS(SELECT 1 FROM unlocks u WHERE u.user_id = ${userId} AND u.listing_id = l.id)` : fastify.sql`false`} AS is_unlocked_by_me,
      ${userId ? fastify.sql`EXISTS(SELECT 1 FROM saved_listings s WHERE s.user_id = ${userId} AND s.listing_id = l.id)` : fastify.sql`false`} AS is_saved_by_me,
      COALESCE(
        (SELECT json_agg(json_build_object('url', p.url, 'isCover', p.is_cover) ORDER BY p.display_order)
         FROM listing_photos p WHERE p.listing_id = l.id),
        '[]'::json
      ) AS photos
    FROM listings l
    LEFT JOIN areas a ON l.area_id = a.id
    WHERE l.status = 'active'
      ${minPrice != null ? fastify.sql`AND l.price_kes >= ${minPrice}` : fastify.sql``}
      ${maxPrice != null ? fastify.sql`AND l.price_kes <= ${maxPrice}` : fastify.sql``}
      ${bedrooms != null ? fastify.sql`AND l.bedrooms = ${bedrooms}` : fastify.sql``}
      ${propertyType ? fastify.sql`AND l.property_type = ${propertyType}::property_type` : fastify.sql``}
      ${verified ? fastify.sql`AND l.is_verified = true` : fastify.sql``}
      ${areaSlug ? fastify.sql`AND a.slug = ${areaSlug}` : fastify.sql``}
      ${q ? fastify.sql`AND l.title ILIKE ${'%' + q + '%'}` : fastify.sql``}
      ${lat != null && lng != null && radiusMeters
        ? fastify.sql`AND ST_DWithin(l.coordinates::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})`
        : fastify.sql``}
    ORDER BY l.is_featured DESC, l.published_at DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `;

  return { listings, page, limit };
}

export async function getListingById(fastify: FastifyInstance, id: string, userId?: string) {
  const [listing] = await fastify.sql`
    SELECT
      l.*,
      ST_X(l.coordinates) AS coord_lng,
      ST_Y(l.coordinates) AS coord_lat,
      a.id AS area_id, a.slug AS area_slug, a.name AS area_name,
      a.safety_rating, a.safety_label, a.cost_tier, a.rent_range_min, a.rent_range_max, a.mobility_score,
      ag.id AS agent_id, ag.display_name AS agent_display_name, ag.company_name AS agent_company,
      ag.logo_url AS agent_logo,
      u.email AS agent_email, u.phone AS agent_phone,
      ${userId ? fastify.sql`EXISTS(SELECT 1 FROM unlocks un WHERE un.user_id = ${userId} AND un.listing_id = l.id)` : fastify.sql`false`} AS is_unlocked_by_me,
      ${userId ? fastify.sql`EXISTS(SELECT 1 FROM saved_listings s WHERE s.user_id = ${userId} AND s.listing_id = l.id)` : fastify.sql`false`} AS is_saved_by_me,
      COALESCE(
        (SELECT json_agg(json_build_object('id', p.id, 'url', p.url, 'isCover', p.is_cover) ORDER BY p.display_order)
         FROM listing_photos p WHERE p.listing_id = l.id),
        '[]'::json
      ) AS photos
    FROM listings l
    LEFT JOIN areas a ON l.area_id = a.id
    LEFT JOIN agents ag ON l.agent_id = ag.id
    LEFT JOIN users u ON ag.user_id = u.id
    WHERE l.id = ${id} AND l.status = 'active'
  `;

  if (!listing) {
    throw { statusCode: 404, code: 'LISTING_NOT_FOUND', message: 'Listing not found' };
  }

  // Increment view count (fire and forget)
  fastify.sql`UPDATE listings SET view_count = view_count + 1 WHERE id = ${id}`.catch(() => {});

  const isUnlocked = listing.isUnlockedByMe;

  // Build response — hide sensitive fields if not unlocked
  const view: any = {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    descriptionTeaser: listing.descriptionTeaser ?? listing.descriptionFull?.slice(0, 200),
    propertyType: listing.propertyType,
    priceKes: listing.priceKes,
    pricePeriod: listing.pricePeriod,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    areaSqft: listing.areaSqft,
    furnishing: listing.furnishing,
    parking: listing.parking,
    petsAllowed: listing.petsAllowed,
    wifi: listing.wifi,
    amenities: listing.amenities,
    city: listing.city,
    availableFrom: listing.availableFrom,
    depositMonths: listing.depositMonths,
    unlockPriceKes: listing.unlockPriceKes,
    isVerified: listing.isVerified,
    isFeatured: listing.isFeatured,
    isLocked: !isUnlocked,
    isUnlockedByMe: isUnlocked,
    isSavedByMe: listing.isSavedByMe,
    viewCount: listing.viewCount,
    unlockCount: listing.unlockCount,
    photos: listing.photos,
    area: listing.areaId ? {
      slug: listing.areaSlug,
      name: listing.areaName,
      safetyRating: listing.safetyRating,
      safetyLabel: listing.safetyLabel,
      costTier: listing.costTier,
      rentRangeMin: listing.rentRangeMin,
      rentRangeMax: listing.rentRangeMax,
      mobilityScore: listing.mobilityScore,
    } : undefined,
    agent: {
      id: listing.agentId,
      displayName: listing.agentDisplayName,
      companyName: listing.agentCompany,
      logoUrl: listing.agentLogo,
      ...(isUnlocked ? { phone: listing.agentPhone, email: listing.agentEmail } : {}),
    },
  };

  if (isUnlocked) {
    view.descriptionFull = listing.descriptionFull;
    view.address = listing.address;
    view.coordinates = listing.coordLat != null ? { lat: listing.coordLat, lng: listing.coordLng } : null;
    view.caretakerName = listing.caretakerName;
    view.caretakerPhone = listing.caretakerPhone;
  }

  return view;
}

export async function getFeaturedListings(fastify: FastifyInstance, limit = 10) {
  const listings = await fastify.sql`
    SELECT
      l.id, l.slug, l.title, l.price_kes, l.bedrooms, l.bathrooms, l.property_type,
      l.is_verified, l.is_featured, l.unlock_price_kes, l.city,
      a.name AS area_name, a.slug AS area_slug,
      COALESCE(
        (SELECT json_agg(json_build_object('url', p.url, 'isCover', p.is_cover) ORDER BY p.display_order)
         FROM listing_photos p WHERE p.listing_id = l.id),
        '[]'::json
      ) AS photos
    FROM listings l
    LEFT JOIN areas a ON l.area_id = a.id
    WHERE l.status = 'active' AND l.is_featured = true
    ORDER BY l.published_at DESC
    LIMIT ${limit}
  `;
  return { listings };
}

export async function getMapPins(fastify: FastifyInstance, bounds: { swLat: number; swLng: number; neLat: number; neLng: number }) {
  const { swLat, swLng, neLat, neLng } = bounds;
  const pins = await fastify.sql`
    SELECT
      l.id, l.price_kes, l.property_type,
      ST_X(ST_Translate(l.coordinates, (random() - 0.5) * 0.004, (random() - 0.5) * 0.004)) AS approx_lng,
      ST_Y(ST_Translate(l.coordinates, (random() - 0.5) * 0.004, (random() - 0.5) * 0.004)) AS approx_lat
    FROM listings l
    WHERE l.status = 'active'
      AND l.coordinates && ST_MakeEnvelope(${swLng}, ${swLat}, ${neLng}, ${neLat}, 4326)
    LIMIT 200
  `;
  return { pins };
}
