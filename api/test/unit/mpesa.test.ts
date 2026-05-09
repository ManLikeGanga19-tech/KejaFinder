import { describe, it, expect } from 'vitest';
import {
  mapDarajaResultCode,
  extractDarajaReceipt,
  isFromDaraja,
  type DarajaCallbackResult,
} from '../../src/lib/mpesa.js';

describe('mapDarajaResultCode', () => {
  it.each([
    [0, 'completed'],
    [1032, 'cancelled'],
    [1037, 'timeout'],
    [1, 'failed'],
    [2001, 'failed'],
    [9999, 'failed'],
  ])('maps %i → %s', (code, status) => {
    expect(mapDarajaResultCode(code)).toBe(status);
  });
});

describe('extractDarajaReceipt', () => {
  const successCallback: DarajaCallbackResult = {
    ResultCode: 0,
    ResultDesc: 'The service request is processed successfully.',
    CheckoutRequestID: 'ws_CO_08052026_123',
    CallbackMetadata: {
      Item: [
        { Name: 'Amount', Value: 499 },
        { Name: 'MpesaReceiptNumber', Value: 'NLJ7RT61SV' },
        { Name: 'TransactionDate', Value: 20260508120000 },
        { Name: 'PhoneNumber', Value: 254712345678 },
      ],
    },
  };

  it('extracts receipt fields from a success callback', () => {
    const result = extractDarajaReceipt(successCallback);
    expect(result).toEqual({
      receiptNumber: 'NLJ7RT61SV',
      transactionDate: '20260508120000',
      phone: '254712345678',
      amount: 499,
    });
  });

  it('returns null for non-success result code', () => {
    expect(extractDarajaReceipt({ ...successCallback, ResultCode: 1032 })).toBeNull();
  });

  it('returns null when CallbackMetadata is missing', () => {
    expect(extractDarajaReceipt({ ResultCode: 0 })).toBeNull();
  });

  it('returns null when required fields are missing', () => {
    const partial: DarajaCallbackResult = {
      ResultCode: 0,
      CallbackMetadata: { Item: [{ Name: 'Amount', Value: 499 }] },
    };
    expect(extractDarajaReceipt(partial)).toBeNull();
  });

  it('returns null when MpesaReceiptNumber is not a string', () => {
    const bad: DarajaCallbackResult = {
      ResultCode: 0,
      CallbackMetadata: {
        Item: [
          { Name: 'Amount', Value: 499 },
          { Name: 'MpesaReceiptNumber', Value: 12345 as unknown as string },
          { Name: 'TransactionDate', Value: 20260508120000 },
          { Name: 'PhoneNumber', Value: 254712345678 },
        ],
      },
    };
    expect(extractDarajaReceipt(bad)).toBeNull();
  });
});

describe('isFromDaraja', () => {
  it.each([
    ['196.201.214.1', true],
    ['196.201.214.255', true],
    ['196.201.214.0', true],
    ['196.201.213.1', false],
    ['196.201.215.1', false],
    ['8.8.8.8', false],
    ['127.0.0.1', false],
    ['::1', false],
    ['not-an-ip', false],
    ['', false],
  ])('isFromDaraja(%s) === %s', (ip, expected) => {
    expect(isFromDaraja(ip)).toBe(expected);
  });
});
