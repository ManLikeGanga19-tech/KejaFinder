import type { FastifyPluginAsync } from 'fastify';

const areasRouter: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: { tags: ['areas'], summary: 'List all areas' },
  }, async () => {
    const areas = await fastify.sql`
      SELECT id, slug, name, city, safety_rating, cost_tier, rent_range_min, rent_range_max,
             (SELECT COUNT(*)::int FROM listings WHERE area_id = areas.id AND status = 'active') AS active_listings_count
      FROM areas WHERE is_active = true
      ORDER BY area_score DESC
    `;
    return { success: true, data: { areas } };
  });

  fastify.get('/recommended', {
    schema: { tags: ['areas'], summary: 'Recommended areas (top picks)' },
  }, async () => {
    const areas = await fastify.sql`
      SELECT id, slug, name, safety_rating, cost_tier, rent_range_min, rent_range_max,
             (SELECT COUNT(*)::int FROM listings WHERE area_id = areas.id AND status = 'active') AS active_listings_count
      FROM areas WHERE is_active = true
      ORDER BY area_score DESC
      LIMIT 8
    `;
    return { success: true, data: { areas } };
  });

  fastify.get('/:slug', {
    schema: { tags: ['areas'], summary: 'Full Area Intelligence' },
  }, async (req, reply) => {
    const { slug } = req.params as any;
    const [area] = await fastify.sql`
      SELECT id, slug, name, city, tags, hero_image_url, local_insight, area_score,
             safety_rating, safety_label, safety_notes, cost_tier, rent_range_min, rent_range_max,
             mobility_score, walkability_score, connectivity_mins, connectivity_route,
             investment_growth_pct, rental_yield_pct, demand_score
      FROM areas WHERE slug = ${slug} AND is_active = true
    `;
    if (!area) return reply.code(404).send({ success: false, error: { code: 'AREA_NOT_FOUND', message: 'Area not found' } });

    const amenities = await fastify.sql`
      SELECT id, name, category, subcategory, distance_km, rating, is_top_tier
      FROM area_amenities WHERE area_id = ${area.id}
      ORDER BY category, distance_km NULLS LAST
    `;

    // Group amenities by category
    const grouped: Record<string, any[]> = {};
    for (const a of amenities) {
      if (!grouped[a.category]) grouped[a.category] = [];
      grouped[a.category].push(a);
    }
    const amenityGroups = Object.entries(grouped).map(([category, items]) => ({ category, items }));

    return { success: true, data: { area: { ...area, amenities: amenityGroups } } };
  });

  fastify.get('/:slug/preview', {
    schema: { tags: ['areas'], summary: 'Area preview teaser (for locked listings)' },
  }, async (req, reply) => {
    const { slug } = req.params as any;
    const [area] = await fastify.sql`
      SELECT slug, name, safety_rating, safety_label, cost_tier, rent_range_min, rent_range_max, mobility_score
      FROM areas WHERE slug = ${slug} AND is_active = true
    `;
    if (!area) return reply.code(404).send({ success: false, error: { code: 'AREA_NOT_FOUND', message: 'Area not found' } });
    return { success: true, data: { area } };
  });

  fastify.get('/:slug/listings', {
    schema: { tags: ['areas'], summary: 'Listings within an area' },
  }, async (req) => {
    const { slug } = req.params as any;
    const { limit = 20 } = (req.query as any) ?? {};
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
      JOIN areas a ON l.area_id = a.id
      WHERE a.slug = ${slug} AND l.status = 'active'
      ORDER BY l.is_featured DESC, l.published_at DESC NULLS LAST
      LIMIT ${limit}
    `;
    return { success: true, data: { listings } };
  });
};

export default areasRouter;
