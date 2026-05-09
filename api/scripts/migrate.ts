import postgres from 'postgres';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function run() {
  const migrationsDir = path.resolve(__dirname, '../db/migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  // Ensure schema_migrations exists (the first migration creates it; idempotent re-runs are safe)
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const appliedRows = await sql<{ version: string }[]>`SELECT version FROM schema_migrations`;
  const applied = new Set(appliedRows.map(r => r.version));

  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    if (applied.has(version)) {
      console.log(`✓ ${version} (already applied)`);
      continue;
    }
    const sqlText = readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`→ applying ${version}...`);
    try {
      await sql.unsafe(sqlText);
      console.log(`✓ ${version} applied`);
    } catch (err) {
      console.error(`✗ ${version} failed:`, err);
      process.exit(1);
    }
  }

  await sql.end();
  console.log('All migrations done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
