import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import {
  assertValidIdempotencyKey,
  isValidIdempotencyKey,
  InvalidIdempotencyKeyError,
} from '../../src/lib/idempotency.js';

describe('idempotency', () => {
  describe('assertValidIdempotencyKey', () => {
    it('accepts a real UUID v4', () => {
      const key = randomUUID();
      expect(assertValidIdempotencyKey(key)).toBe(key.toLowerCase());
    });

    it('lowercases the returned key', () => {
      const real = randomUUID();
      expect(assertValidIdempotencyKey(real.toUpperCase())).toBe(real.toLowerCase());
    });

    it('rejects empty string', () => {
      expect(() => assertValidIdempotencyKey('')).toThrow(InvalidIdempotencyKeyError);
    });

    it('rejects undefined', () => {
      expect(() => assertValidIdempotencyKey(undefined)).toThrow(/required/i);
    });

    it('rejects non-string', () => {
      expect(() => assertValidIdempotencyKey(12345)).toThrow(InvalidIdempotencyKeyError);
      expect(() => assertValidIdempotencyKey({})).toThrow(InvalidIdempotencyKeyError);
    });

    it('rejects UUID v1 (wrong version digit)', () => {
      expect(() => assertValidIdempotencyKey('6ba7b810-9dad-11d1-80b4-00c04fd430c8'))
        .toThrow(InvalidIdempotencyKeyError);
    });

    it('rejects malformed UUID', () => {
      expect(() => assertValidIdempotencyKey('not-a-uuid')).toThrow(InvalidIdempotencyKeyError);
      expect(() => assertValidIdempotencyKey('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'))
        .toThrow(InvalidIdempotencyKeyError);
    });

    it('error has correct code and statusCode', () => {
      try {
        assertValidIdempotencyKey('bad');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidIdempotencyKeyError);
        expect((e as InvalidIdempotencyKeyError).code).toBe('INVALID_IDEMPOTENCY_KEY');
        expect((e as InvalidIdempotencyKeyError).statusCode).toBe(400);
      }
    });
  });

  describe('isValidIdempotencyKey', () => {
    it('returns true for valid v4', () => {
      expect(isValidIdempotencyKey(randomUUID())).toBe(true);
    });

    it('returns false for invalid', () => {
      expect(isValidIdempotencyKey('')).toBe(false);
      expect(isValidIdempotencyKey(null)).toBe(false);
      expect(isValidIdempotencyKey('not-a-uuid')).toBe(false);
    });

    it('acts as a type guard', () => {
      const k: unknown = randomUUID();
      if (isValidIdempotencyKey(k)) {
        expect(k.length).toBe(36);
      }
    });
  });
});
