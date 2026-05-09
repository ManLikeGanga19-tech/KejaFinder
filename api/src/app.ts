import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import dbPlugin from './plugins/db.js';
import redisPlugin from './plugins/redis.js';
import firebaseAuthPlugin from './plugins/firebase-auth.js';
import swaggerPlugin from './plugins/swagger.js';

import authRouter from './modules/auth/auth.router.js';
import usersRouter from './modules/users/users.router.js';
import listingsRouter from './modules/listings/listings.router.js';
import areasRouter from './modules/areas/areas.router.js';
import paymentsRouter from './modules/payments/payments.router.js';
import agentsRouter from './modules/agents/agents.router.js';
import mediaRouter from './modules/media/media.router.js';
import notificationsRouter from './modules/notifications/notifications.router.js';
import adminRouter from './modules/admin/admin.router.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    trustProxy: true,
  });

  // Security
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://kejafinder.co.ke', 'https://www.kejafinder.co.ke']
      : true,
    credentials: true,
  });

  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    skipOnError: true,
    keyGenerator: (request) => request.ip,
    allowList: ['196.201.214.0/24'], // Safaricom Daraja IP range
  });

  // Infrastructure plugins
  await app.register(dbPlugin);
  await app.register(redisPlugin);
  await app.register(firebaseAuthPlugin);
  await app.register(swaggerPlugin);

  // Health check
  app.get('/health', { schema: { hide: true } }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));

  // API v1 routes
  await app.register(authRouter,          { prefix: '/v1/auth' });
  await app.register(usersRouter,         { prefix: '/v1/users' });
  await app.register(listingsRouter,      { prefix: '/v1/listings' });
  await app.register(areasRouter,         { prefix: '/v1/areas' });
  await app.register(paymentsRouter,      { prefix: '/v1/payments' });
  await app.register(agentsRouter,        { prefix: '/v1/agents' });
  await app.register(mediaRouter,         { prefix: '/v1/media' });
  await app.register(notificationsRouter, { prefix: '/v1/notifications' });
  await app.register(adminRouter,         { prefix: '/v1/admin' });

  return app;
}
