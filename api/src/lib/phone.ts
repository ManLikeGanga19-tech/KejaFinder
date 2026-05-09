/**
 * Kenyan phone number normalization to E.164 format (+254XXXXXXXXX).
 *
 * Accepts:
 *   "0712345678"      → "+254712345678"
 *   "0112345678"      → "+254112345678"
 *   "254712345678"    → "+254712345678"
 *   "+254712345678"   → "+254712345678" (passthrough)
 *   "712345678"       → "+254712345678"
 *
 * Throws InvalidPhoneError on:
 *   - empty / null
 *   - non-Kenyan country code
 *   - wrong length
 *   - invalid prefix (Safaricom 7XX/1XX, Airtel/Telkom prefixes are valid)
 */

export class InvalidPhoneError extends Error {
  readonly code = 'INVALID_PHONE';
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhoneError';
  }
}

const VALID_E164 = /^\+254(7|1)\d{8}$/;

export function normalizePhone(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    throw new InvalidPhoneError('Phone number is required');
  }

  const cleaned = input.replace(/[\s\-()]/g, '');

  let normalized: string;
  if (cleaned.startsWith('+254')) {
    normalized = cleaned;
  } else if (cleaned.startsWith('254')) {
    normalized = `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    normalized = `+254${cleaned.slice(1)}`;
  } else if (/^[71]\d{8}$/.test(cleaned)) {
    normalized = `+254${cleaned}`;
  } else if (cleaned.startsWith('+') && !cleaned.startsWith('+254')) {
    throw new InvalidPhoneError('Only Kenyan (+254) numbers are supported');
  } else {
    throw new InvalidPhoneError(`Invalid phone format: "${input}"`);
  }

  if (!VALID_E164.test(normalized)) {
    throw new InvalidPhoneError(`Invalid Kenyan mobile number: "${input}"`);
  }

  return normalized;
}

export function isValidKenyanPhone(input: string): boolean {
  try {
    normalizePhone(input);
    return true;
  } catch {
    return false;
  }
}
