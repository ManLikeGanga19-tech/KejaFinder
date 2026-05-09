import type { FastifyPluginAsync } from 'fastify';

const notificationsRouter: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.requireAuth);

  fastify.get('/', {
    schema: { tags: ['notifications'], summary: 'List notifications', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { unreadOnly } = (req.query as any) ?? {};
    const notifications = await fastify.sql`
      SELECT id, type, title, body, data, read_at, created_at
      FROM notifications
      WHERE user_id = ${req.userId!}
        ${unreadOnly === 'true' ? fastify.sql`AND read_at IS NULL` : fastify.sql``}
      ORDER BY created_at DESC LIMIT 50
    `;
    return { success: true, data: { notifications } };
  });

  fastify.patch('/:id/read', {
    schema: { tags: ['notifications'], summary: 'Mark notification as read', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { id } = req.params as any;
    await fastify.sql`UPDATE notifications SET read_at = NOW() WHERE id = ${id} AND user_id = ${req.userId!}`;
    return { success: true, data: { read: true } };
  });

  fastify.post('/read-all', {
    schema: { tags: ['notifications'], summary: 'Mark all as read', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    await fastify.sql`UPDATE notifications SET read_at = NOW() WHERE user_id = ${req.userId!} AND read_at IS NULL`;
    return { success: true, data: { read: true } };
  });

  fastify.delete('/:id', {
    schema: { tags: ['notifications'], summary: 'Delete notification', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { id } = req.params as any;
    await fastify.sql`DELETE FROM notifications WHERE id = ${id} AND user_id = ${req.userId!}`;
    return { success: true, data: { deleted: true } };
  });

  fastify.post('/push-token', {
    schema: {
      tags: ['notifications'],
      summary: 'Register FCM/Expo push token',
      security: [{ BearerAuth: [] }],
      body: {
        type: 'object',
        required: ['token', 'platform'],
        properties: {
          token: { type: 'string' },
          platform: { type: 'string', enum: ['ios', 'android', 'web'] },
        },
      },
    },
  }, async (req, reply) => {
    const { token, platform } = req.body as any;
    await fastify.sql`
      INSERT INTO push_tokens (user_id, token, platform)
      VALUES (${req.userId!}, ${token}, ${platform})
      ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id
    `;
    return reply.code(201).send({ success: true, data: { registered: true } });
  });

  fastify.delete('/push-token/:token', {
    schema: { tags: ['notifications'], summary: 'Deregister push token', security: [{ BearerAuth: [] }] },
  }, async (req) => {
    const { token } = req.params as any;
    await fastify.sql`DELETE FROM push_tokens WHERE token = ${token} AND user_id = ${req.userId!}`;
    return { success: true, data: { deregistered: true } };
  });
};

export default notificationsRouter;
