import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { sql } from '../db/client.js';

declare module 'fastify' {
  interface FastifyInstance {
    sql: typeof sql;
  }
}

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('sql', sql);

  fastify.addHook('onClose', async () => {
    await sql.end({ timeout: 5 });
    fastify.log.info('Postgres pool closed');
  });

  // Smoke-check the connection
  try {
    await sql`SELECT 1`;
    fastify.log.info('Postgres connection ready');
  } catch (err) {
    fastify.log.error({ err }, 'Postgres connection failed');
    throw err;
  }
};

export default fp(dbPlugin, { name: 'db' });
