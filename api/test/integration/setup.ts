import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import postgres, { type Sql } from 'postgres';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let container: StartedTestContainer | null = null;
let sql: Sql | null = null;

export async function startTestDb(): Promise<{ sql: Sql; databaseUrl: string }> {
  if (sql && container) {
    return { sql, databaseUrl: connectionString(container) };
  }

  container = await new GenericContainer('postgis/postgis:16-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'kejafinder_test',
    })
    .withExposedPorts(5432)
    .withStartupTimeout(120_000)
    .start();

  const databaseUrl = connectionString(container);

  sql = postgres(databaseUrl, {
    max: 5,
    transform: { column: postgres.toCamel },
  });

  await runMigrations(sql);

  return { sql, databaseUrl };
}

export async function stopTestDb(): Promise<void> {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
  if (container) {
    await container.stop();
    container = null;
  }
}

export async function resetDb(s: Sql): Promise<void> {
  await s`
    TRUNCATE
      saved_listings, leads, unlocks, payments,
      listing_photos, listing_analytics, listings,
      area_amenities, areas,
      agent_kyc_documents, agents,
      push_tokens, notifications, users
    RESTART IDENTITY CASCADE
  `;
}

function connectionString(c: StartedTestContainer): string {
  return `postgres://test:test@${c.getHost()}:${c.getMappedPort(5432)}/kejafinder_test`;
}

async function runMigrations(s: Sql): Promise<void> {
  const migrationsDir = path.resolve(__dirname, '../../db/migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sqlText = readFileSync(path.join(migrationsDir, file), 'utf8');
    await s.unsafe(sqlText);
  }
}
