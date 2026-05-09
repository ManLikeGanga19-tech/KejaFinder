import type { FastifyPluginAsync } from 'fastify';

const agentsRouter: FastifyPluginAsync = async (fastify) => {
  // Public agent profile
  fastify.get('/:id/profile', {
    schema: { tags: ['agents'], summary: 'Public agent profile' },
  }, async (req, reply) => {
    const { id } = req.params as any;
    const [agent] = await fastify.sql`
      SELECT a.id, a.display_name, a.company_name, a.bio, a.logo_url, a.kyc_status,
             a.total_views,
             (SELECT COUNT(*)::int FROM listings WHERE agent_id = a.id AND status = 'active') AS active_listings_count
      FROM agents a WHERE a.id = ${id} AND a.is_active = true
    `;
    if (!agent) return reply.code(404).send({ success: false, error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found' } });
    return { success: true, data: { agent } };
  });

  // Authenticated routes
  fastify.register(async (authed) => {
    authed.addHook('preHandler', fastify.requireAuth);

    authed.post('/register', {
      schema: { tags: ['agents'], summary: 'Upgrade consumer to agent', security: [{ BearerAuth: [] }] },
    }, async (req, reply) => {
      const { displayName, companyName, bio, licenseNumber, nationalId } = (req.body as any) ?? {};
      try {
        const [agent] = await fastify.sql`
          INSERT INTO agents (user_id, display_name, company_name, bio, license_number, national_id, kyc_status)
          VALUES (${req.userId!}, ${displayName}, ${companyName ?? null}, ${bio ?? null}, ${licenseNumber ?? null}, ${nationalId ?? null}, 'pending_review')
          RETURNING id, display_name, kyc_status
        `;
        await fastify.sql`UPDATE users SET role = 'agent' WHERE id = ${req.userId!}`;
        return reply.code(201).send({ success: true, data: { agent } });
      } catch (err: any) {
        if (err.code === '23505') return reply.code(409).send({ success: false, error: { code: 'ALREADY_AGENT', message: 'User is already an agent' } });
        throw err;
      }
    });

    authed.get('/me', {
      schema: { tags: ['agents'], summary: 'My agent profile', security: [{ BearerAuth: [] }] },
    }, async (req) => {
      const [agent] = await fastify.sql`SELECT * FROM agents WHERE user_id = ${req.userId!}`;
      return { success: true, data: { agent } };
    });

    authed.patch('/me', {
      schema: { tags: ['agents'], summary: 'Update agent profile', security: [{ BearerAuth: [] }] },
    }, async (req) => {
      const { bio, companyName, logoUrl } = (req.body as any) ?? {};
      const [agent] = await fastify.sql`
        UPDATE agents
        SET bio = COALESCE(${bio ?? null}, bio),
            company_name = COALESCE(${companyName ?? null}, company_name),
            logo_url = COALESCE(${logoUrl ?? null}, logo_url),
            updated_at = NOW()
        WHERE user_id = ${req.userId!}
        RETURNING *
      `;
      return { success: true, data: { agent } };
    });

    authed.get('/me/dashboard', {
      schema: { tags: ['agents'], summary: 'Agent dashboard stats', security: [{ BearerAuth: [] }] },
    }, async (req) => {
      const [agent] = await fastify.sql`SELECT id FROM agents WHERE user_id = ${req.userId!}`;
      if (!agent) return { success: true, data: { stats: {}, activeProperties: [], recentLeads: [] } };

      const [stats] = await fastify.sql`
        SELECT
          (SELECT COUNT(*)::int FROM leads WHERE agent_id = ${agent.id}) AS total_leads,
          (SELECT COUNT(*)::int FROM listings WHERE agent_id = ${agent.id} AND status = 'active') AS active_listings,
          (SELECT COALESCE(SUM(view_count), 0)::int FROM listings WHERE agent_id = ${agent.id}) AS total_views,
          (SELECT COALESCE(SUM(unlock_count), 0)::int FROM listings WHERE agent_id = ${agent.id}) AS total_unlocks
      `;
      const activeProperties = await fastify.sql`
        SELECT id, slug, title, view_count, unlock_count, price_kes
        FROM listings WHERE agent_id = ${agent.id} AND status = 'active'
        ORDER BY published_at DESC LIMIT 10
      `;
      const recentLeads = await fastify.sql`
        SELECT l.id, l.created_at, l.contacted, lst.title AS listing_title, u.name AS user_name
        FROM leads l
        JOIN listings lst ON lst.id = l.listing_id
        JOIN users u ON u.id = l.user_id
        WHERE l.agent_id = ${agent.id}
        ORDER BY l.created_at DESC LIMIT 5
      `;
      return { success: true, data: { stats, activeProperties, recentLeads } };
    });

    authed.get('/me/listings', {
      schema: { tags: ['agents'], summary: 'My listings', security: [{ BearerAuth: [] }] },
    }, async (req) => {
      const [agent] = await fastify.sql`SELECT id FROM agents WHERE user_id = ${req.userId!}`;
      if (!agent) return { success: true, data: { listings: [] } };
      const listings = await fastify.sql`
        SELECT id, slug, title, price_kes, status, view_count, unlock_count, is_featured, created_at
        FROM listings WHERE agent_id = ${agent.id}
        ORDER BY created_at DESC
      `;
      return { success: true, data: { listings } };
    });

    authed.post('/me/listings', {
      schema: { tags: ['agents'], summary: 'Create listing', security: [{ BearerAuth: [] }] },
    }, async (req, reply) => {
      const [agent] = await fastify.sql`SELECT id, kyc_status FROM agents WHERE user_id = ${req.userId!}`;
      if (!agent) return reply.code(403).send({ success: false, error: { code: 'NOT_AN_AGENT', message: 'Not an agent' } });
      if (agent.kycStatus !== 'approved') {
        return reply.code(403).send({ success: false, error: { code: 'KYC_NOT_VERIFIED', message: 'KYC verification required' } });
      }
      const body = (req.body as any) ?? {};
      const slug = `${body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
      const [listing] = await fastify.sql`
        INSERT INTO listings (slug, agent_id, area_id, title, description_full, description_teaser,
                              property_type, price_kes, bedrooms, bathrooms, city, address,
                              unlock_price_kes, status)
        VALUES (${slug}, ${agent.id}, ${body.areaId ?? null}, ${body.title}, ${body.descriptionFull},
                ${(body.descriptionFull ?? '').slice(0, 200)}, ${body.propertyType}::property_type,
                ${body.priceKes}, ${body.bedrooms}, ${body.bathrooms}, ${body.city ?? 'Nairobi'},
                ${body.address ?? null}, ${body.unlockPriceKes ?? 499}, 'pending_review')
        RETURNING id, slug, status
      `;
      return reply.code(201).send({ success: true, data: { listing } });
    });

    authed.patch('/me/listings/:id', {
      schema: { tags: ['agents'], summary: 'Update listing', security: [{ BearerAuth: [] }] },
    }, async (req) => {
      const { id } = req.params as any;
      const body = (req.body as any) ?? {};
      const [agent] = await fastify.sql`SELECT id FROM agents WHERE user_id = ${req.userId!}`;
      const [listing] = await fastify.sql`
        UPDATE listings SET
          title = COALESCE(${body.title ?? null}, title),
          description_full = COALESCE(${body.descriptionFull ?? null}, description_full),
          price_kes = COALESCE(${body.priceKes ?? null}, price_kes),
          updated_at = NOW()
        WHERE id = ${id} AND agent_id = ${agent.id}
        RETURNING *
      `;
      return { success: true, data: { listing } };
    });

    authed.delete('/me/listings/:id', {
      schema: { tags: ['agents'], summary: 'Delete listing', security: [{ BearerAuth: [] }] },
    }, async (req) => {
      const { id } = req.params as any;
      const [agent] = await fastify.sql`SELECT id FROM agents WHERE user_id = ${req.userId!}`;
      await fastify.sql`UPDATE listings SET status = 'archived' WHERE id = ${id} AND agent_id = ${agent.id}`;
      return { success: true, data: { archived: true } };
    });

    authed.get('/me/leads', {
      schema: { tags: ['agents'], summary: 'All leads', security: [{ BearerAuth: [] }] },
    }, async (req) => {
      const [agent] = await fastify.sql`SELECT id FROM agents WHERE user_id = ${req.userId!}`;
      if (!agent) return { success: true, data: { leads: [] } };
      const leads = await fastify.sql`
        SELECT l.id, l.created_at, l.contacted, lst.title, u.name AS user_name, u.phone AS user_phone
        FROM leads l
        JOIN listings lst ON lst.id = l.listing_id
        JOIN users u ON u.id = l.user_id
        WHERE l.agent_id = ${agent.id}
        ORDER BY l.created_at DESC
      `;
      return { success: true, data: { leads } };
    });
  });
};

export default agentsRouter;
