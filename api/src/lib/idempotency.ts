/**
 * Idempotency key validation for payment endpoints.
 *
 * Clients MUST generate a UUID v4 before calling /payments/initiate.
 * The key is stored in payments.idempotency_key with a UNIQUE constraint.
 * Re-sending the same key returns the original payment record without
 * re-triggering an STK Push — this prevents double-charging on network retry.
 */

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class InvalidIdempotencyKeyError extends Error {
  readonly code = 'INVALID_IDEMPOTENCY_KEY';
  readonly statusCode = 400;
  constructor(message = 'idempotencyKey must be a valid UUID v4') {
    super(message);
    this.name = 'InvalidIdempotencyKeyError';
  }
}

export function assertValidIdempotencyKey(key: unknown): string {
  if (typeof key !== 'string') {
    throw new InvalidIdempotencyKeyError('idempotencyKey is required');
  }
  if (!UUID_V4_REGEX.test(key)) {
    throw new InvalidIdempotencyKeyError();
  }
  return key.toLowerCase();
}

export function isValidIdempotencyKey(key: unknown): key is string {
  return typeof key === 'string' && UUID_V4_REGEX.test(key);
}
