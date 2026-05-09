import { describe, it, expect } from 'vitest';
import { normalizePhone, isValidKenyanPhone, InvalidPhoneError } from '../../src/lib/phone.js';

describe('normalizePhone', () => {
  describe('valid inputs', () => {
    it.each([
      ['0712345678', '+254712345678'],
      ['0112345678', '+254112345678'],
      ['254712345678', '+254712345678'],
      ['+254712345678', '+254712345678'],
      ['712345678', '+254712345678'],
      ['+254 712 345 678', '+254712345678'],
      ['+254-712-345-678', '+254712345678'],
      ['(254)712345678', '+254712345678'],
    ])('normalizes %s → %s', (input, expected) => {
      expect(normalizePhone(input)).toBe(expected);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty', () => {
      expect(() => normalizePhone('')).toThrow(InvalidPhoneError);
    });

    it('rejects null', () => {
      expect(() => normalizePhone(null)).toThrow(/required/i);
    });

    it('rejects undefined', () => {
      expect(() => normalizePhone(undefined)).toThrow(/required/i);
    });

    it('rejects non-string types', () => {
      // @ts-expect-error testing runtime behaviour
      expect(() => normalizePhone(254712345678)).toThrow(InvalidPhoneError);
    });

    it('rejects non-Kenyan country codes', () => {
      expect(() => normalizePhone('+255712345678')).toThrow(/Kenyan/);
      expect(() => normalizePhone('+1234567890')).toThrow(/Kenyan/);
    });

    it('rejects too-short numbers', () => {
      expect(() => normalizePhone('071234')).toThrow(InvalidPhoneError);
    });

    it('rejects too-long numbers', () => {
      expect(() => normalizePhone('071234567890')).toThrow(InvalidPhoneError);
    });

    it('rejects invalid prefixes (not 7 or 1)', () => {
      expect(() => normalizePhone('0212345678')).toThrow(InvalidPhoneError);
      expect(() => normalizePhone('0312345678')).toThrow(InvalidPhoneError);
      expect(() => normalizePhone('0512345678')).toThrow(InvalidPhoneError);
    });

    it('error has code property', () => {
      try {
        normalizePhone('invalid');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidPhoneError);
        expect((e as InvalidPhoneError).code).toBe('INVALID_PHONE');
      }
    });
  });

  describe('isValidKenyanPhone', () => {
    it('returns true for valid', () => {
      expect(isValidKenyanPhone('0712345678')).toBe(true);
      expect(isValidKenyanPhone('+254712345678')).toBe(true);
    });

    it('returns false for invalid', () => {
      expect(isValidKenyanPhone('')).toBe(false);
      expect(isValidKenyanPhone('+1234567890')).toBe(false);
      expect(isValidKenyanPhone('not-a-number')).toBe(false);
    });
  });
});
