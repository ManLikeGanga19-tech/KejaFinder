import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

/**
 * postgres.js connection pool.
 *
 * In production: DATABASE_URL is the Cloud SQL private IP via VPC connector.
 * Locally: localhost:5432.
 *
 * `transform.column: postgres.toCamel` automatically converts snake_case
 * column names to camelCase in JS land. So a row {first_name: 'X'} becomes
 * {firstName: 'X'}.
 */
export const sql = postgres(process.env.DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  transform: {
    column: postgres.toCamel,
  },
});

export type Sql = typeof sql;
