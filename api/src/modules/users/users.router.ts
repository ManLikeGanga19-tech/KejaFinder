import type { FastifyPluginAsync } from 'fastify';

const usersRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireAuth);

  fastify.get('/me', {
    schema: { tags: ['users'], summary: 'Get current user profile', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const [user] = await fastify.sql`
      SELECT id, firebase_uid, name, email, phone, role, avatar_url, created_at
      FROM users WHERE id = ${req.userId!}
    `;
    return { success: true, data: { user } };
  });

  fastify.patch('/me', {
    schema: {
      tags: ['users'],
      summary: 'Update current user profile',
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          avatarUrl: { type: 'string', format: 'uri' },
        },
      },
    },
  }, async (req) => {
    const { name, avatarUrl } = req.body as any;
    const [user] = await fastify.sql`
      UPDATE users
      SET name = COALESCE(${name ?? null}, name),
          avatar_url = COALESCE(${avatarUrl ?? null}, avatar_url),
          updated_at = NOW()
      WHERE id = ${req.userId!}
      RETURNING id, name, email, phone, avatar_url
    `;
    return { success: true, data: { user } };
  });

  fastify.delete('/me', {
    schema: { tags: ['users'], summary: 'Request account deletion', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    await fastify.sql`UPDATE users SET is_active = false WHERE id = ${req.userId!}`;
    return { success: true, data: { deleted: true } };
  });

  fastify.get('/me/saved-listings', {
    schema: { tags: ['users'], summary: 'Get my saved listings', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const listings = await fastify.sql`
      SELECT l.id, l.slug, l.title, l.price_kes, l.bedrooms, l.bathrooms, l.property_type,
             l.city, l.unlock_price_kes, l.is_verified, l.is_featured,
             EXISTS(SELECT 1 FROM unlocks u WHERE u.user_id = ${req.userId!} AND u.listing_id = l.id) AS is_unlocked_by_me
      FROM saved_listings s
      JOIN listings l ON l.id = s.listing_id
      WHERE s.user_id = ${req.userId!}
      ORDER BY s.created_at DESC
    `;
    return { success: true, data: { listings } };
  });

  fastify.post('/me/saved-listings/:listingId', {
    schema: { tags: ['users'], summary: 'Save a listing', security: [{ BearerAuth: [] }] },
  }, async (req, reply) => {
    const { listingId } = req.params as any;
    await fastify.sql`
      INSERT INTO saved_listings (user_id, listing_id) VALUES (${req.userId!}, ${listingId})
      ON CONFLICT DO NOTHING
    `;
    return reply.code(201).send({ success: true, data: { saved: true } });
  });

  fastify.delete('/me/saved-listings/:listingId', {
    schema: { tags: ['users'], summary: 'Unsave a listing', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { listingId } = req.params as any;
    await fastify.sql`DELETE FROM saved_listings WHERE user_id = ${req.userId!} AND listing_id = ${listingId}`;
    return { success: true, data: { saved: false } };
  });

  fastify.get('/me/unlocks', {
    schema: { tags: ['users'], summary: 'Unlock history', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const unlocks = await fastify.sql`
      SELECT u.id, u.unlocked_at, l.id AS listing_id, l.slug, l.title, l.price_kes, l.city
      FROM unlocks u
      JOIN listings l ON l.id = u.listing_id
      WHERE u.user_id = ${req.userId!}
      ORDER BY u.unlocked_at DESC
    `;
    return { success: true, data: { unlocks } };
  });

  fastify.get('/me/payments', {
    schema: { tags: ['users'], summary: 'Payment history', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const payments = await fastify.sql`
      SELECT id, payment_type, status, amount_kes, mpesa_receipt_number, created_at
      FROM payments WHERE user_id = ${req.userId!}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return { success: true, data: { payments } };
  });
};

export default usersRouter;
