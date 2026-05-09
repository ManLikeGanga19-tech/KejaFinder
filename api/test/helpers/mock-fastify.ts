import { vi, type Mock } from 'vitest';
import type { FastifyInstance } from 'fastify';

/**
 * Mock postgres.js sql tagged template. Provide an array of result sets
 * (one per call, in order) and we'll return them sequentially.
 */
export function mockSql(results: unknown[][] = []) {
  let i = 0;
  const fn = vi.fn(async () => {
    const result = results[i] ?? [];
    i += 1;
    return result;
  });
  return fn as unknown as FastifyInstance['sql'];
}

export function mockFastify(opts: {
  sqlResults?: unknown[][];
  redis?: Partial<FastifyInstance['redis']>;
} = {}): FastifyInstance {
  const sql = mockSql(opts.sqlResults ?? []);

  const log: any = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
  };
  log.child = vi.fn(() => log);

  const redis = {
    get: vi.fn(async () => null),
    set: vi.fn(async () => 'OK'),
    setex: vi.fn(async () => 'OK'),
    del: vi.fn(async () => 1),
    ...opts.redis,
  };

  return { sql, log, redis } as unknown as FastifyInstance;
}

export function sqlCalls(fastify: FastifyInstance): Mock {
  return fastify.sql as unknown as Mock;
}
