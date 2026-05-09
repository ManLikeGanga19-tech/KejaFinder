import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function run() {
  const seedPath = path.resolve(__dirname, '../db/seed.sql');
  const seedText = readFileSync(seedPath, 'utf8');

  console.log('→ running seed.sql...');
  try {
    await sql.unsafe(seedText);
    console.log('✓ seed complete');

    const [counts] = await sql<{ users: number; agents: number; areas: number; listings: number; photos: number }[]>`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM agents) AS agents,
        (SELECT COUNT(*)::int FROM areas) AS areas,
        (SELECT COUNT(*)::int FROM listings) AS listings,
        (SELECT COUNT(*)::int FROM listing_photos) AS photos
    `;
    console.table(counts);
  } catch (err) {
    console.error('✗ seed failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
