import admin from 'firebase-admin';
import type { FastifyInstance } from 'fastify';

export async function registerUser(
  fastify: FastifyInstance,
  firebaseIdToken: string,
  name: string,
  phone: string,
  role: 'consumer' | 'agent',
) {
  const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
  const { uid, email } = decoded;

  if (!email) {
    throw { statusCode: 400, code: 'EMAIL_REQUIRED', message: 'Firebase account must have an email address.' };
  }

  const existing = await fastify.sql`
    SELECT id FROM users WHERE firebase_uid = ${uid} OR email = ${email} OR phone = ${phone}
  `;
  if (existing.length) {
    throw { statusCode: 409, code: 'DUPLICATE_CREDENTIAL', message: 'An account with this email or phone already exists.' };
  }

  const [user] = await fastify.sql`
    INSERT INTO users (firebase_uid, name, email, phone, role, email_verified, phone_verified)
    VALUES (${uid}, ${name}, ${email}, ${phone}, ${role}, true, true)
    RETURNING id, firebase_uid, name, email, phone, role, created_at
  `;

  return user;
}

export async function syncUser(fastify: FastifyInstance, firebaseIdToken: string) {
  const decoded = await admin.auth().verifyIdToken(firebaseIdToken);

  const users = await fastify.sql`
    SELECT id, firebase_uid, name, email, phone, role, created_at
    FROM users
    WHERE firebase_uid = ${decoded.uid} AND is_active = true
  `;

  if (!users.length) {
    throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'No account found. Please register first.' };
  }

  await fastify.sql`
    UPDATE users SET last_login_at = NOW() WHERE id = ${users[0].id}
  `;

  return users[0];
}
