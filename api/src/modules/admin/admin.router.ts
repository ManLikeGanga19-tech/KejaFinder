import type { FastifyPluginAsync } from 'fastify';

const adminRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (req, reply) => {
    await fastify.requireAuth(req, reply);
    if (reply.sent) return;
    if (req.userRole !== 'admin') {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }
  });

  fastify.get('/listings/queue', {
    schema: { tags: ['admin'], summary: 'Listing moderation queue', security: [{ BearerAuth: [] }] },
  }, async () => {
    const listings = await fastify.sql`
      SELECT l.id, l.title, l.created_at, l.price_kes, l.bedrooms, l.city,
             a.display_name AS agent_name
      FROM listings l
      LEFT JOIN agents a ON a.id = l.agent_id
      WHERE l.status = 'pending_review'
      ORDER BY l.created_at ASC
    `;
    return { success: true, data: { listings } };
  });

  fastify.patch('/listings/:id/approve', {
    schema: { tags: ['admin'], summary: 'Approve listing', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { id } = req.params as any;
    await fastify.sql`
      UPDATE listings SET status = 'active', approved_at = NOW(), published_at = NOW() WHERE id = ${id}
    `;
    return { success: true, data: { approved: true } };
  });

  fastify.patch('/listings/:id/reject', {
    schema: { tags: ['admin'], summary: 'Reject listing', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { id } = req.params as any;
    const { reason } = (req.body as any) ?? {};
    await fastify.sql`UPDATE listings SET status = 'rejected', rejected_reason = ${reason ?? null} WHERE id = ${id}`;
    return { success: true, data: { rejected: true } };
  });

  fastify.patch('/listings/:id/feature', {
    schema: { tags: ['admin'], summary: 'Toggle featured', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { id } = req.params as any;
    await fastify.sql`UPDATE listings SET is_featured = NOT is_featured WHERE id = ${id}`;
    return { success: true, data: { toggled: true } };
  });

  fastify.get('/agents/queue', {
    schema: { tags: ['admin'], summary: 'Agent KYC queue', security: [{ BearerAuth: [] }] },
  }, async () => {
    const agents = await fastify.sql`
      SELECT a.id, a.display_name, a.company_name, a.kyc_status, a.created_at, u.email, u.phone
      FROM agents a
      JOIN users u ON u.id = a.user_id
      WHERE a.kyc_status = 'pending_review'
      ORDER BY a.created_at ASC
    `;
    return { success: true, data: { agents } };
  });

  fastify.patch('/agents/:id/verify', {
    schema: { tags: ['admin'], summary: 'Approve agent KYC', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { id } = req.params as any;
    await fastify.sql`UPDATE agents SET kyc_status = 'approved', kyc_verified_at = NOW() WHERE id = ${id}`;
    return { success: true, data: { approved: true } };
  });

  fastify.patch('/agents/:id/reject', {
    schema: { tags: ['admin'], summary: 'Reject KYC', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { id } = req.params as any;
    const { reason } = (req.body as any) ?? {};
    await fastify.sql`UPDATE agents SET kyc_status = 'rejected', kyc_rejected_reason = ${reason ?? null} WHERE id = ${id}`;
    return { success: true, data: { rejected: true } };
  });

  fastify.patch('/agents/:id/suspend', {
    schema: { tags: ['admin'], summary: 'Suspend agent', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { id } = req.params as any;
    await fastify.sql`UPDATE agents SET is_active = false WHERE id = ${id}`;
    await fastify.sql`UPDATE listings SET status = 'inactive' WHERE agent_id = ${id} AND status = 'active'`;
    return { success: true, data: { suspended: true } };
  });

  fastify.get('/stats', {
    schema: { tags: ['admin'], summary: 'Platform statistics', security: [{ BearerAuth: [] }] },
  }, async () => {
    const [stats] = await fastify.sql`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE is_active = true) AS active_users,
        (SELECT COUNT(*)::int FROM agents WHERE is_active = true AND kyc_status = 'approved') AS active_agents,
        (SELECT COUNT(*)::int FROM listings WHERE status = 'active') AS active_listings,
        (SELECT COUNT(*)::int FROM payments WHERE status = 'completed') AS completed_payments,
        (SELECT COALESCE(SUM(amount_kes), 0)::int FROM payments WHERE status = 'completed') AS total_revenue_kes,
        (SELECT COUNT(*)::int FROM unlocks) AS total_unlocks
    `;
    return { success: true, data: { stats } };
  });
};

export default adminRouter;
