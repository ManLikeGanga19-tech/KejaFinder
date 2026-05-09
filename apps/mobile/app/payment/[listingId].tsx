import React, { useEffect, useRef, useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { apiFetch } from '../../src/lib/api';

type Step = 'confirm' | 'pending' | 'success' | 'failed';

export default function PaymentScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [listing, setListing] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<Step>('confirm');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  useEffect(() => {
    if (!listingId) return;
    apiFetch<{ listing: any }>(`/listings/${listingId}`, { auth: true })
      .then(d => setListing(d.listing))
      .catch(() => {});
  }, [listingId]);

  useEffect(() => {
    if (step !== 'pending' || !checkoutId) return;
    pollCount.current = 0;
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
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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

  const cover = listing?.photos?.find((p: any) => p.isCover) ?? listing?.photos?.[0];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.dragHandle} />
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {listing && (
          <View style={styles.listingRow}>
            {cover ? <Image source={{ uri: cover.url }} style={styles.listingThumb} /> : <View style={[styles.listingThumb, styles.listingThumbPlaceholder]} />}
            <View style={styles.listingInfo}>
              <Text variant="titleSmall" numberOfLines={2}>{listing.title}</Text>
              <Text variant="bodySmall" color={Colors.onSurfaceVariant}>{listing.area?.name ?? listing.city}</Text>
            </View>
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.stepContainer}>
            <View style={styles.amountBlock}>
              <View style={styles.mpesaLogo}><Text style={styles.mpesaLogoText}>M-PESA</Text></View>
              <Text variant="headlineLarge" style={styles.amount}>KES {listing?.unlockPriceKes ?? 499}</Text>
              <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>One-time unlock fee · No subscription</Text>
            </View>
            <View style={styles.benefitsList}>
              {([
                ['location-outline', 'Exact address and floor/building details'],
                ['call-outline', 'Agent phone number and email'],
                ['home-outline', 'Caretaker contacts for viewing'],
                ['document-text-outline', 'Full property description'],
                ['lock-open-outline', 'Unlocked forever — no expiry'],
              ] as const).map(([icon, text]) => (
                <View key={text} style={styles.benefitItem}>
                  <Ionicons name={icon} size={18} color={Colors.primary} style={{ marginRight: Spacing[3] }} />
                  <Text variant="bodyMedium" style={{ flex: 1 }}>{text}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inputGroup}>
              <Text variant="labelLarge">M-Pesa phone number</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone} onChangeText={setPhone}
                placeholder="0712 345 678" placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="phone-pad" maxLength={13}
              />
              <Text variant="bodySmall" color={Colors.onSurfaceVariant}>You'll receive an STK Push prompt on this number</Text>
              {errorMsg ? <Text variant="bodySmall" color={Colors.error}>{errorMsg}</Text> : null}
            </View>
            <TouchableOpacity style={[styles.payBtn, submitting && styles.payBtnDisabled]} onPress={handlePay} disabled={submitting} activeOpacity={0.85}>
              {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.payBtnText}>Pay KES {listing?.unlockPriceKes ?? 499} with M-Pesa</Text>}
            </TouchableOpacity>
            <View style={styles.secureNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color={Colors.onSurfaceVariant} style={{ marginRight: 4 }} />
              <Text variant="bodySmall" color={Colors.onSurfaceVariant}>Secured by Safaricom Daraja · Payments are non-refundable</Text>
            </View>
          </View>
        )}

        {step === 'pending' && (
          <View style={styles.centeredStep}>
            <ActivityIndicator color={Colors.mpesa} size="large" style={{ marginBottom: Spacing[6] }} />
            <Text variant="titleLarge" style={{ textAlign: 'center', marginBottom: Spacing[3] }}>Waiting for M-Pesa</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', lineHeight: 22 }}>
              Check your phone{phone ? ` (${phone})` : ''} for the M-Pesa STK Push prompt.{'\n\n'}
              Enter your M-Pesa PIN to complete the payment.
            </Text>
          </View>
        )}

        {(step === 'success' || step === 'failed') && (
          <View style={styles.centeredStep}>
            <View style={[styles.resultIcon, step === 'success' ? styles.resultIconSuccess : styles.resultIconFail]}>
              <Ionicons
                name={step === 'success' ? 'checkmark' : 'close'}
                size={36}
                color={step === 'success' ? Colors.success : Colors.error}
              />
            </View>
            <Text variant="titleLarge" style={{ textAlign: 'center' }}>
              {step === 'success' ? 'Payment confirmed!' : 'Payment not completed'}
            </Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing[4] }}>
              {step === 'success'
                ? 'The listing is now unlocked. You can see the full address, agent contacts, and caretaker details.'
                : (errorMsg || 'Your payment could not be processed.')}
            </Text>
            <TouchableOpacity style={[styles.payBtn, step === 'failed' && { backgroundColor: Colors.secondary }]} onPress={handleDone}>
              <Text style={styles.payBtnText}>{step === 'success' ? 'View unlocked listing' : 'Try again'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceContainerLowest, borderTopLeftRadius: BorderRadius['3xl'], borderTopRightRadius: BorderRadius['3xl'] },
  header: { alignItems: 'center', paddingBottom: Spacing[2] },
  dragHandle: { width: 40, height: 4, backgroundColor: Colors.outlineVariant, borderRadius: BorderRadius.full, marginBottom: Spacing[3] },
  closeBtn: { position: 'absolute', right: Layout.screenPaddingH, top: 12, width: 36, height: 36, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 16, color: Colors.onSurface },
  scroll: { padding: Layout.screenPaddingH, gap: Spacing[6] },
  listingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], backgroundColor: Colors.surfaceContainerLow, borderRadius: BorderRadius.xl, padding: Spacing[3] },
  listingThumb: { width: 64, height: 56, borderRadius: BorderRadius.lg, backgroundColor: Colors.surfaceContainerHigh },
  listingThumbPlaceholder: { backgroundColor: Colors.surfaceContainerHigh },
  listingInfo: { flex: 1, gap: 4 },
  stepContainer: { gap: Spacing[5] },
  amountBlock: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[4] },
  mpesaLogo: { backgroundColor: Colors.mpesaLight, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: BorderRadius.lg, marginBottom: Spacing[2] },
  mpesaLogoText: { fontFamily: Typography.fontHeadline, fontSize: Typography.size.base, fontWeight: Typography.weight.extrabold, color: Colors.mpesa, letterSpacing: 2 },
  amount: { letterSpacing: -1 },
  benefitsList: { backgroundColor: Colors.primaryFixed, borderRadius: BorderRadius.xl, padding: Spacing[4], gap: Spacing[3] },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  inputGroup: { gap: Spacing[2] },
  phoneInput: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[4],
    fontFamily: Typography.fontBody, fontSize: Typography.size.lg,
    fontWeight: Typography.weight.medium, color: Colors.onSurface,
    letterSpacing: 1, borderWidth: 1.5, borderColor: Colors.outlineVariant,
  },
  payBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: Spacing[5], alignItems: 'center', ...Shadows.primary },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { fontFamily: Typography.fontBody, fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.white },
  secureNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  centeredStep: { alignItems: 'center', paddingVertical: Spacing[6], gap: Spacing[4] },
  resultIcon: { width: 72, height: 72, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  resultIconSuccess: { backgroundColor: Colors.successContainer },
  resultIconFail: { backgroundColor: Colors.errorContainer },
  resultIconText: { fontFamily: Typography.fontHeadline, fontSize: 32, fontWeight: Typography.weight.bold, color: Colors.onSurface },
});
