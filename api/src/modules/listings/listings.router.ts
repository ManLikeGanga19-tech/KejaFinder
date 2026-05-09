import type { FastifyPluginAsync } from 'fastify';
import { searchListings, getListingById, getFeaturedListings, getMapPins } from './listings.service.js';

const listingsRouter: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      tags: ['listings'],
      summary: 'Search listings',
      description: 'Geo-aware listing search with filters. Returns paginated results with cover photos.',
      querystring: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lng: { type: 'number' },
          radiusKm: { type: 'number', default: 5 },
          minPrice: { type: 'integer', minimum: 0 },
          maxPrice: { type: 'integer', minimum: 0 },
          bedrooms: { type: 'integer', minimum: 0 },
          propertyType: { type: 'string' },
          verified: { type: 'boolean' },
          areaSlug: { type: 'string' },
          q: { type: 'string' },
          sortBy: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
      },
    },
  }, async (req) => {
    const params = { ...(req.query as any), userId: (req as any).userId };
    const result = await searchListings(fastify, params);
    return { success: true, data: result };
  });

  fastify.get('/featured', {
    schema: { tags: ['listings'], summary: 'Featured listings carousel' },
  }, async () => {
    const data = await getFeaturedListings(fastify);
    return { success: true, data };
  });

  fastify.get('/map-pins', {
    schema: {
      tags: ['listings'],
      summary: 'Map pins (lightweight, jittered coords)',
      querystring: {
        type: 'object',
        required: ['swLat', 'swLng', 'neLat', 'neLng'],
        properties: {
          swLat: { type: 'number' },
          swLng: { type: 'number' },
          neLat: { type: 'number' },
          neLng: { type: 'number' },
        },
      },
    },
  }, async (req) => {
    const data = await getMapPins(fastify, req.query as any);
    return { success: true, data };
  });

  fastify.get('/:id', {
    schema: { tags: ['listings'], summary: 'Listing detail (locked or unlocked based on payment)' },
  }, async (req, reply) => {
    const { id } = req.params as any;
    // Optional auth — try to identify user but don't require it
    const auth = req.headers.authorization;
    let userId: string | undefined;
    if (auth?.startsWith('Bearer ')) {
      try {
        const admin = (await import('firebase-admin')).default;
        if (admin.apps.length) {
          const decoded = await admin.auth().verifyIdToken(auth.slice(7));
          const [u] = await fastify.sql`SELECT id FROM users WHERE firebase_uid = ${decoded.uid}`;
          userId = u?.id;
        }
      } catch {}
    }
    try {
      const listing = await getListingById(fastify, id, userId);
      return { success: true, data: { listing } };
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({
        success: false,
        error: { code: err.code ?? 'INTERNAL', message: err.message ?? 'Internal error' },
      });
    }
  });
};

export default listingsRouter;
