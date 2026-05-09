import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Sql } from 'postgres';
import { startTestDb, stopTestDb, resetDb } from './setup.js';

let sql: Sql;

beforeAll(async () => {
  const db = await startTestDb();
  sql = db.sql;
}, 180_000);

afterAll(async () => {
  await stopTestDb();
});

beforeEach(async () => {
  await resetDb(sql);
});

describe('payments.idempotency_key UNIQUE constraint', () => {
  it('rejects duplicate insert with same idempotency_key', async () => {
    const userId = await seedUser();
    const listingId = await seedListing();
    const key = randomUUID();

    await sql`
      INSERT INTO payments (user_id, listing_id, payment_type, amount_kes, mpesa_phone, idempotency_key)
      VALUES (${userId}, ${listingId}, 'unlock', 499, '+254712345678', ${key})
    `;

    await expect(
      sql`
        INSERT INTO payments (user_id, listing_id, payment_type, amount_kes, mpesa_phone, idempotency_key)
        VALUES (${userId}, ${listingId}, 'unlock', 499, '+254712345678', ${key})
      `,
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('allows different idempotency keys', async () => {
    const userId = await seedUser();
    const listingId = await seedListing();

    await sql`
      INSERT INTO payments (user_id, listing_id, payment_type, amount_kes, mpesa_phone, idempotency_key)
      VALUES (${userId}, ${listingId}, 'unlock', 499, '+254712345678', ${randomUUID()})
    `;

    await sql`
      INSERT INTO payments (user_id, listing_id, payment_type, amount_kes, mpesa_phone, idempotency_key)
      VALUES (${userId}, ${listingId}, 'unlock', 499, '+254712345678', ${randomUUID()})
    `;

    const [row] = await sql`SELECT COUNT(*)::int AS n FROM payments`;
    expect(row.n).toBe(2);
  });

  it('idempotency lookup pattern (SELECT ... WHERE idempotency_key = $1)', async () => {
    const userId = await seedUser();
    const listingId = await seedListing();
    const key = randomUUID();

    const [created] = await sql`
      INSERT INTO payments (user_id, listing_id, payment_type, amount_kes, mpesa_phone, idempotency_key)
      VALUES (${userId}, ${listingId}, 'unlock', 499, '+254712345678', ${key})
      RETURNING id, status, amount_kes, idempotency_key
    `;

    const [found] = await sql`
      SELECT id, status, amount_kes FROM payments WHERE idempotency_key = ${key}
    `;
    expect(found.id).toBe(created.id);
    expect(found.status).toBe('pending');
    expect(found.amountKes).toBe(499);
  });
});

describe('unlocks UNIQUE(user_id, listing_id) — one unlock per user+listing', () => {
  it('rejects duplicate unlock for same user+listing', async () => {
    const userId = await seedUser();
    const listingId = await seedListing();
    const paymentId1 = await seedPayment(userId, listingId);
    const paymentId2 = await seedPayment(userId, listingId);

    await sql`
      INSERT INTO unlocks (user_id, listing_id, payment_id) VALUES (${userId}, ${listingId}, ${paymentId1})
    `;

    await expect(
      sql`
        INSERT INTO unlocks (user_id, listing_id, payment_id) VALUES (${userId}, ${listingId}, ${paymentId2})
      `,
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('allows different users to unlock the same listing', async () => {
    const user1 = await seedUser('+254712111111', 'user1@x.com');
    const user2 = await seedUser('+254712222222', 'user2@x.com');
    const listingId = await seedListing();
    const p1 = await seedPayment(user1, listingId);
    const p2 = await seedPayment(user2, listingId);

    await sql`INSERT INTO unlocks (user_id, listing_id, payment_id) VALUES (${user1}, ${listingId}, ${p1})`;
    await sql`INSERT INTO unlocks (user_id, listing_id, payment_id) VALUES (${user2}, ${listingId}, ${p2})`;

    const [row] = await sql`SELECT COUNT(*)::int AS n FROM unlocks WHERE listing_id = ${listingId}`;
    expect(row.n).toBe(2);
  });
});

async function seedUser(phone = '+254712345678', email = 'test@example.com'): Promise<string> {
  const [u] = await sql`
    INSERT INTO users (firebase_uid, name, email, phone, role)
    VALUES (${randomUUID()}, 'Test User', ${email}, ${phone}, 'consumer')
    RETURNING id
  `;
  return u.id;
}

async function seedListing(): Promise<string> {
  const [agentUser] = await sql`
    INSERT INTO users (firebase_uid, name, email, phone, role)
    VALUES (${randomUUID()}, 'Agent', ${'agent' + Math.random() + '@x.com'}, ${'+25470' + Math.floor(Math.random() * 1e7).toString().padStart(7, '0')}, 'agent')
    RETURNING id
  `;
  const [agent] = await sql`
    INSERT INTO agents (user_id, display_name, kyc_status)
    VALUES (${agentUser.id}, 'Test Agent', 'approved')
    RETURNING id
  `;
  const [listing] = await sql`
    INSERT INTO listings (slug, agent_id, title, description_full, property_type, price_kes, bedrooms, bathrooms, status, unlock_price_kes)
    VALUES (${'l-' + randomUUID()}, ${agent.id}, '2BR Apt', 'Full desc', 'apartment', 65000, 2, 2, 'active', 499)
    RETURNING id
  `;
  return listing.id;
}

async function seedPayment(userId: string, listingId: string): Promise<string> {
  const [p] = await sql`
    INSERT INTO payments (user_id, listing_id, payment_type, status, amount_kes, mpesa_phone, idempotency_key)
    VALUES (${userId}, ${listingId}, 'unlock', 'completed', 499, '+254712345678', ${randomUUID()})
    RETURNING id
  `;
  return p.id;
}
