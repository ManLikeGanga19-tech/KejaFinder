/**
 * M-Pesa Daraja API result code mapping.
 *
 * From the Safaricom Daraja docs:
 *   0    → Success
 *   1    → Insufficient funds
 *   1032 → User cancelled
 *   1037 → Timeout (user didn't enter PIN)
 *   2001 → Wrong PIN
 *   1019 → Transaction expired
 *   ...  → Various other failures
 */

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'refunded';

export interface DarajaCallbackResult {
  ResultCode: number;
  ResultDesc?: string;
  CheckoutRequestID?: string;
  CallbackMetadata?: {
    Item?: Array<{ Name: string; Value: string | number }>;
  };
}

export function mapDarajaResultCode(resultCode: number): PaymentStatus {
  if (resultCode === 0) return 'completed';
  if (resultCode === 1032) return 'cancelled';
  if (resultCode === 1037) return 'timeout';
  return 'failed';
}

export function extractDarajaReceipt(callback: DarajaCallbackResult): {
  receiptNumber: string;
  transactionDate: string;
  phone: string;
  amount: number;
} | null {
  if (callback.ResultCode !== 0) return null;
  const items = callback.CallbackMetadata?.Item ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;

  const receiptNumber = get('MpesaReceiptNumber');
  const transactionDate = get('TransactionDate');
  const phone = get('PhoneNumber');
  const amount = get('Amount');

  if (
    typeof receiptNumber !== 'string' ||
    transactionDate === undefined ||
    phone === undefined ||
    typeof amount !== 'number'
  ) {
    return null;
  }

  return {
    receiptNumber,
    transactionDate: String(transactionDate),
    phone: String(phone),
    amount,
  };
}

export const DARAJA_IP_ALLOWLIST = ['196.201.214.0/24'];

export function isFromDaraja(ip: string): boolean {
  const match = ip.match(/^(\d+)\.(\d+)\.(\d+)\./);
  if (!match) return false;
  const [, a, b, c] = match;
  return a === '196' && b === '201' && c === '214';
}
