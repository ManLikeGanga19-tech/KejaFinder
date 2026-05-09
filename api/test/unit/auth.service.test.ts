import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockFastify } from '../helpers/mock-fastify.js';
import { factories } from '../helpers/factories.js';

vi.mock('firebase-admin', () => {
  const verifyIdToken = vi.fn();
  return {
    default: {
      auth: () => ({ verifyIdToken }),
    },
    __verifyIdToken: verifyIdToken,
  };
});

const admin = await import('firebase-admin');
const { registerUser, syncUser } = await import('../../src/modules/auth/auth.service.js');
const verifyIdToken = (admin as unknown as { __verifyIdToken: ReturnType<typeof vi.fn> }).__verifyIdToken;

beforeEach(() => {
  verifyIdToken.mockReset();
});

describe('registerUser', () => {
  const validToken = 'valid.firebase.token';
  const decoded = { uid: 'firebase_uid_123', email: 'james@example.com' };

  it('creates a user when token is valid and no duplicate exists', async () => {
    verifyIdToken.mockResolvedValue(decoded);
    const newUser = factories.user({ firebase_uid: decoded.uid, email: decoded.email });
    const fastify = mockFastify({
      sqlResults: [
        [],
        [newUser],
      ],
    });

    const result = await registerUser(fastify, validToken, 'James Waweru', '+254712345678', 'consumer');

    expect(verifyIdToken).toHaveBeenCalledWith(validToken);
    expect(result).toEqual(newUser);
  });

  it('rejects when Firebase account has no email', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'x', email: undefined });
    const fastify = mockFastify();

    await expect(
      registerUser(fastify, validToken, 'X', '+254712345678', 'consumer'),
    ).rejects.toMatchObject({ code: 'EMAIL_REQUIRED', statusCode: 400 });
  });

  it('rejects when user with same firebase_uid/email/phone already exists', async () => {
    verifyIdToken.mockResolvedValue(decoded);
    const fastify = mockFastify({
      sqlResults: [
        [{ id: 'existing_user_id' }],
      ],
    });

    await expect(
      registerUser(fastify, validToken, 'X', '+254712345678', 'consumer'),
    ).rejects.toMatchObject({ code: 'DUPLICATE_CREDENTIAL', statusCode: 409 });
  });

  it('passes role through correctly (agent)', async () => {
    verifyIdToken.mockResolvedValue(decoded);
    const newAgent = factories.user({ role: 'agent' });
    const fastify = mockFastify({ sqlResults: [[], [newAgent]] });

    const result = await registerUser(fastify, validToken, 'Agent', '+254712345678', 'agent');
    expect(result.role).toBe('agent');
  });

  it('propagates Firebase verification errors', async () => {
    verifyIdToken.mockRejectedValue(new Error('auth/id-token-expired'));
    const fastify = mockFastify();

    await expect(
      registerUser(fastify, validToken, 'X', '+254712345678', 'consumer'),
    ).rejects.toThrow(/expired/);
  });
});

describe('syncUser', () => {
  const validToken = 'valid.firebase.token';
  const decoded = { uid: 'firebase_uid_123' };

  it('returns the user and updates last_login_at', async () => {
    verifyIdToken.mockResolvedValue(decoded);
    const user = factories.user({ firebase_uid: decoded.uid });
    const fastify = mockFastify({
      sqlResults: [
        [user],
        [],
      ],
    });

    const result = await syncUser(fastify, validToken);

    expect(result).toEqual(user);
    expect(fastify.sql).toHaveBeenCalledTimes(2);
  });

  it('throws USER_NOT_FOUND when no user matches', async () => {
    verifyIdToken.mockResolvedValue(decoded);
    const fastify = mockFastify({ sqlResults: [[]] });

    await expect(syncUser(fastify, validToken)).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
      statusCode: 404,
    });
  });
});
