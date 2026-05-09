import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on('error', (err) => fastify.log.warn({ err }, 'Redis error'));
  client.on('connect', () => fastify.log.info('Redis connected'));

  fastify.decorate('redis', client);

  fastify.addHook('onClose', async () => {
    await client.quit();
    fastify.log.info('Redis closed');
  });
};

export default fp(redisPlugin, { name: 'redis' });
