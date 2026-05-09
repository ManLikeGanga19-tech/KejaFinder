import React, { useEffect, useRef, useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Eyebrow } from '../../src/components/ui/Eyebrow';
import { apiFetch } from '../../src/lib/api';

type Step = 'confirm' | 'pending' | 'success' | 'failed';

interface Listing {
  id: string;
  title: string;
  city: string;
  area?: { name: string };
  unlockPriceKes: number;
  priceKes: number;
  photos: { url: string; isCover: boolean }[];
}

export default function PaymentScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState<Listing | null>(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<Step>('confirm');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step progress index for the pending UI: 0=initiated, 1=awaiting PIN, 2=confirming
  const [progressStep, setProgressStep] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!listingId) return;
    apiFetch<{ listing: Listing }>(`/listings/${listingId}`, { auth: true })
      .then(d => setListing(d.listing))
      .catch(() => {});
  }, [listingId]);

  // Polling + visual progress while waiting for M-Pesa callback
  useEffect(() => {
    if (step !== 'pending' || !checkoutId) return;
    pollCount.current = 0;
    setProgressStep(0);

    // Visual progression: 0 → 1 (after 4s) → 2 (after 12s)
    const t1 = setTimeout(() => setProgressStep(1), 4000);
    const t2 = setTimeout(() => setProgressStep(2), 12000);

    pollRef.current = setInterval(async () => {
      pollCount.current++;
      try {
        const res = await apiFetch<{ payment: { status: string } }>(`/payments/${checkoutId}/status`, { auth: true });
        const s = res.payment.status;
        if (s === 'completed') { clearInterval(pollRef.current!); setStep('success'); }
        else if (['failed', 'cancelled', 'timeout'].includes(s)) {
          clearInterval(pollRef.current!);
          setErrorMsg(s === 'cancelled' ? 'Payment was cancelled.' : 'Payment failed or timed out. Please try again.');
          setStep('failed');
        }
      } catch {}
      if (pollCount.current >= 30) {
        clearInterval(pollRef.current!);
        setErrorMsg('Payment confirmation timed out. If you paid, it will be processed shortly.');
        setStep('failed');
      }
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(t1); clearTimeout(t2);
    };
  }, [step, checkoutId]);

  const handlePay = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!/^\+?254\d{9}$|^07\d{8}$|^01\d{8}$/.test(cleaned)) {
      setErrorMsg('Enter a valid Safaricom number (e.g. 0712345678)');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    const e164 = cleaned.startsWith('+') ? cleaned : cleaned.startsWith('0') ? `+254${cleaned.slice(1)}` : `+${cleaned}`;
    const idempotencyKey = generateUUID();
    try {
      const res = await apiFetch<{ payment: { checkoutRequestId: string } }>('/payments/initiate', {
        method: 'POST', auth: true,
        body: { listingId, paymentType: 'unlock', mpesaPhone: e164, idempotencyKey },
      });
      setCheckoutId(res.payment.checkoutRequestId);
      setStep('pending');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Could not initiate payment. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handleDone = () => {
    if (step === 'success') router.replace(`/listing/${listingId}` as any);
    else setStep('confirm');
  };

  const unlockPrice = listing?.unlockPriceKes ?? 499;
  const securityDeposit = 0;     // for booking flow (zero on unlock-only)
  const processingFee = 0;
  const total = unlockPrice + securityDeposit + processingFee;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader showBack onBack={() => router.back()} showMenu={false} trailing="none" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing[8] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        decelerationRate="normal"
        overScrollMode="never"
      >
        {/* ── Booking Summary card ── */}
        <View style={styles.card}>
          <Text variant="headlineMedium" style={styles.cardTitle}>Booking Summary</Text>
          <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={styles.cardSubtitle}>
            Secure your urban dwelling in Nairobi's most curated spaces.
          </Text>

          <View style={styles.line} />

          <SummaryRow
            label={listing?.title ?? 'Property unlock'}
            value={`KES ${unlockPrice.toLocaleString()}`}
          />
          {securityDeposit > 0 && (
            <SummaryRow
              label="Security Deposit (Refundable)"
              value={`KES ${securityDeposit.toLocaleString()}`}
            />
          )}
          {processingFee > 0 && (
            <SummaryRow
              label="Processing Fee"
              value={`KES ${processingFee.toLocaleString()}`}
            />
          )}
        </View>

        {/* ── Total payable ── */}
        <View style={styles.totalCard}>
          <View style={{ flex: 1 }}>
            <Eyebrow>Total Payable</Eyebrow>
            <Text style={styles.totalAmount}>KES {total.toLocaleString()}</Text>
          </View>
          <View style={styles.securedPill}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
            <Text style={styles.securedText}>SECURED</Text>
          </View>
        </View>

        {/* ── Trust banner ── */}
        <View style={styles.trustBanner}>
          <View style={styles.trustIcon}>
            <Ionicons name="lock-closed" size={18} color={Colors.white} />
          </View>
          <Text variant="bodyMedium" style={styles.trustText}>
            Your transaction is protected by end-to-end encryption and the Urban Curator trust protocol. Funds are held in escrow until lease confirmation.
          </Text>
        </View>

        {/* ── Step content ── */}
        {step === 'confirm' && (
          <View style={[styles.card, { gap: Spacing[4] }]}>
            <View style={styles.mpesaIconCircle}>
              <View style={styles.mpesaIconInner}>
                <Ionicons name="card" size={22} color={Colors.white} />
              </View>
              <View style={styles.mpesaSyncBubble}>
                <Ionicons name="sync" size={12} color={Colors.primary} />
              </View>
            </View>

            <Text variant="titleLarge" style={{ textAlign: 'center' }}>Pay with M-Pesa</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', lineHeight: 22 }}>
              Enter your Safaricom number. You'll receive an STK Push prompt to authorize KES {total.toLocaleString()}.
            </Text>

            <View style={styles.inputGroup}>
              <Text variant="labelLarge">M-Pesa phone number</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="0712 345 678"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="phone-pad"
                maxLength={13}
              />
            </View>

            {errorMsg ? <Text variant="bodySmall" color={Colors.error}>{errorMsg}</Text> : null}

            <TouchableOpacity
              style={[styles.payBtn, submitting && { opacity: 0.6 }]}
              onPress={handlePay}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.payBtnText}>Pay KES {total.toLocaleString()} with M-Pesa</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'pending' && (
          <View style={[styles.card, { gap: Spacing[4] }]}>
            <View style={styles.mpesaIconCircle}>
              <View style={styles.mpesaIconInner}>
                <Ionicons name="card" size={22} color={Colors.white} />
              </View>
              <View style={styles.mpesaSyncBubble}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            </View>

            <Text variant="titleLarge" style={{ textAlign: 'center' }}>Processing...</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', lineHeight: 22 }}>
              Check your phone for the M-Pesa STK Push. Enter your PIN to authorize the payment of <Text style={{ fontWeight: '700', color: Colors.onSurface }}>KES {total.toLocaleString()}</Text>.
            </Text>

            <View style={styles.stepsList}>
              <StepItem
                label="Request initiated"
                state={progressStep > 0 ? 'done' : 'current'}
              />
              <StepItem
                label="Awaiting PIN entry"
                state={progressStep === 0 ? 'pending' : progressStep === 1 ? 'current' : 'done'}
              />
              <StepItem
                label="Confirming with bank"
                state={progressStep < 2 ? 'pending' : 'current'}
              />
            </View>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => { setStep('confirm'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>I didn't receive the prompt</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'success' && (
          <View style={[styles.card, { gap: Spacing[4], alignItems: 'center' }]}>
            <View style={[styles.resultIcon, { backgroundColor: Colors.successContainer }]}>
              <Ionicons name="checkmark" size={40} color={Colors.success} />
            </View>
            <Text variant="titleLarge" style={{ textAlign: 'center' }}>Payment confirmed</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', lineHeight: 22 }}>
              The listing is now unlocked. You can view the full address, agent contacts, and caretaker details.
            </Text>
            <TouchableOpacity style={[styles.payBtn, { marginTop: Spacing[2] }]} onPress={handleDone}>
              <Text style={styles.payBtnText}>View unlocked listing</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        {step === 'failed' && (
          <View style={[styles.card, { gap: Spacing[4], alignItems: 'center' }]}>
            <View style={[styles.resultIcon, { backgroundColor: Colors.errorContainer }]}>
              <Ionicons name="close" size={40} color={Colors.error} />
            </View>
            <Text variant="titleLarge" style={{ textAlign: 'center' }}>Payment not completed</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', lineHeight: 22 }}>
              {errorMsg || 'Your payment could not be processed.'}
            </Text>
            <TouchableOpacity style={[styles.payBtn, { backgroundColor: Colors.secondary, marginTop: Spacing[2] }]} onPress={handleDone}>
              <Text style={styles.payBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Components ─────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={{ flex: 1 }} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function StepItem({ label, state }: { label: string; state: 'pending' | 'current' | 'done' }) {
  return (
    <View style={styles.stepRow}>
      <View
        style={[
          styles.stepDot,
          state === 'done' && styles.stepDotDone,
          state === 'current' && styles.stepDotCurrent,
        ]}
      >
        {state === 'done' && <Ionicons name="checkmark" size={14} color={Colors.white} />}
      </View>
      <Text
        variant="bodyMedium"
        style={{
          color:
            state === 'done' ? Colors.onSurface :
            state === 'current' ? Colors.primary :
            Colors.onSurfaceVariant,
          fontWeight: state === 'current' ? '700' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Layout.screenPaddingH, gap: Spacing[4] },

  // Card
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    ...Shadows.md,
  },
  cardTitle: { color: Colors.primary, letterSpacing: -0.5 },
  cardSubtitle: { marginTop: Spacing[1] },
  line: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    marginVertical: Spacing[4],
    opacity: 0.5,
  },

  // Summary rows
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  summaryValue: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    textAlign: 'right',
  },

  // Total card
  totalCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  totalAmount: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
    letterSpacing: -1,
    marginTop: 2,
  },
  securedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  securedText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 1.2,
  },

  // Trust banner
  trustBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    alignItems: 'flex-start',
    ...Shadows.primary,
  },
  trustIcon: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  trustText: {
    color: 'rgba(255,255,255,0.95)',
    flex: 1,
    lineHeight: 20,
  },

  // M-Pesa icon
  mpesaIconCircle: {
    alignSelf: 'center',
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: Colors.mpesaLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  mpesaIconInner: {
    width: 48, height: 48,
    borderRadius: 12,
    backgroundColor: Colors.mpesa,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  mpesaSyncBubble: {
    position: 'absolute',
    bottom: 6, right: 6,
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  // Inputs
  inputGroup: { gap: Spacing[2] },
  phoneInput: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.medium,
    color: Colors.onSurface,
    letterSpacing: 1,
  },

  // Pay button
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing[5],
    ...Shadows.primary,
  },
  payBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },

  // Steps progress
  stepsList: {
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  stepDot: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepDotCurrent: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },

  // Secondary button
  secondaryBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  secondaryBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.onSurfaceVariant,
  },

  // Result icons
  resultIcon: {
    width: 80, height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
});
