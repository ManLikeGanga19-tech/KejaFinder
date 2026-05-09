import React, { useState } from 'react';
import {
  View, ImageBackground, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  TextInput, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { apiFetch } from '../../src/lib/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Mode = 'welcome' | 'phone' | 'otp' | 'register';

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80',
    eyebrow: 'THE URBAN CURATOR',
    title: 'Find houses\neasily',
    body: "Discover curated living spaces in Kenya's most vibrant urban neighborhoods.",
  },
  {
    image: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1600&q=80',
    eyebrow: 'AREA INTELLIGENCE',
    title: 'Know before\nyou move',
    body: 'Deep-dive data on safety, commute times, and amenities for every neighborhood.',
  },
  {
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80',
    eyebrow: 'M-PESA UNLOCK',
    title: 'Skip the\nmiddlemen',
    body: 'Pay KES 499 to unlock direct contacts. No agent fees. No surprises.',
  },
];

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('welcome');
  const [slide, setSlide] = useState(0);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalize = (raw: string) =>
    raw.startsWith('+') ? raw : raw.startsWith('0') ? `+254${raw.slice(1)}` : `+${raw}`;

  const handleNext = () => {
    if (slide < SLIDES.length - 1) setSlide(slide + 1);
    else setMode('phone');
  };

  const handlePhoneSubmit = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!/^\+?254\d{9}$|^07\d{8}$|^01\d{8}$/.test(cleaned)) {
      setError('Enter a valid +254 number');
      return;
    }
    setError(''); setLoading(true);
    try { setMode('otp'); }
    catch (err: any) { setError(err.message ?? 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleOtpSubmit = async () => {
    if (otp.length < 4) { setError('Enter the code from SMS'); return; }
    setError(''); setLoading(true);
    try {
      const fakeToken = 'firebase-id-token-stub';
      await AsyncStorage.setItem('firebase_token', fakeToken);
      try {
        await apiFetch('/auth/sync', { method: 'POST', body: { firebaseIdToken: fakeToken } });
        router.replace('/(tabs)' as any);
      } catch { setMode('register'); }
    } catch (err: any) { setError(err.message ?? 'Invalid code'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim()) { setError('Enter your full name'); return; }
    setError(''); setLoading(true);
    try {
      const token = await AsyncStorage.getItem('firebase_token');
      await apiFetch('/auth/register', {
        method: 'POST',
        body: {
          firebaseIdToken: token,
          name: name.trim(),
          phone: normalize(phone.replace(/\s/g, '')),
          role: 'consumer',
        },
      });
      router.replace('/(tabs)' as any);
    } catch (err: any) { setError(err.message ?? 'Registration failed'); }
    finally { setLoading(false); }
  };

  // ── Welcome / Onboarding multi-step ──
  if (mode === 'welcome') {
    const s = SLIDES[slide];
    return (
      <View style={styles.welcomeRoot}>
        <ImageBackground source={{ uri: s.image }} style={styles.welcomeImage}>
          <View style={styles.welcomeImageScrim} />
          <View style={[styles.brandBar, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.brandText}>KejaFinder</Text>
          </View>
        </ImageBackground>

        <View style={[styles.welcomeCard, { paddingBottom: insets.bottom + Spacing[5] }]}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>{s.eyebrow}</Text>
          </View>

          <Text variant="displayMedium" style={styles.welcomeTitle}>{s.title}</Text>
          <Text variant="bodyLarge" color={Colors.onSurfaceVariant} style={styles.welcomeBody}>
            {s.body}
          </Text>

          <View style={styles.welcomeFooter}>
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === slide && styles.dotActive]}
                />
              ))}
            </View>

            <View style={styles.welcomeActions}>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => router.replace('/(tabs)' as any)}
              >
                <Text variant="labelLarge" color={Colors.onSurfaceVariant}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>
                  {slide === SLIDES.length - 1 ? 'Get started' : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Phone / OTP / Register flows ──
  return (
    <KeyboardAvoidingView style={styles.formRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.formScroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => mode === 'phone' ? setMode('welcome') : setMode('phone')}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text variant="labelLarge" color={Colors.primary}>Back</Text>
        </TouchableOpacity>

        <View style={styles.formBrand}>
          <Text style={styles.formBrandText}>KejaFinder</Text>
        </View>

        {mode === 'phone' && (
          <View style={styles.formCard}>
            <Text variant="headlineMedium" style={styles.formTitle}>Enter your phone</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>
              We'll send a one-time code to verify your number.
            </Text>
            <TextInput
              style={styles.input}
              value={phone} onChangeText={v => { setPhone(v); setError(''); }}
              placeholder="0712 345 678" placeholderTextColor={Colors.onSurfaceVariant}
              keyboardType="phone-pad" autoFocus maxLength={13}
            />
            {error ? <Text variant="bodySmall" color={Colors.error}>{error}</Text> : null}
            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={handlePhoneSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : (
                <>
                  <Text style={styles.primaryBtnText}>Send code</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'otp' && (
          <View style={styles.formCard}>
            <Text variant="headlineMedium" style={styles.formTitle}>Enter the code</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>
              We sent a 6-digit code to {phone}
            </Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={otp} onChangeText={v => { setOtp(v); setError(''); }}
              placeholder="• • • • • •" placeholderTextColor={Colors.outlineVariant}
              keyboardType="number-pad" maxLength={6} autoFocus textAlign="center"
            />
            {error ? <Text variant="bodySmall" color={Colors.error}>{error}</Text> : null}
            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={handleOtpSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : (
                <>
                  <Text style={styles.primaryBtnText}>Verify</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'register' && (
          <View style={styles.formCard}>
            <Text variant="headlineMedium" style={styles.formTitle}>Complete your profile</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>
              Just a few details to get you started.
            </Text>
            <View style={styles.inputGroup}>
              <Text variant="labelLarge">Full name</Text>
              <TextInput
                style={styles.input}
                value={name} onChangeText={v => { setName(v); setError(''); }}
                placeholder="Your name" placeholderTextColor={Colors.onSurfaceVariant} autoFocus
              />
            </View>
            <View style={styles.inputGroup}>
              <Text variant="labelLarge">Email (optional)</Text>
              <TextInput
                style={styles.input}
                value={email} onChangeText={setEmail}
                placeholder="you@example.com" placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="email-address" autoCapitalize="none"
              />
            </View>
            {error ? <Text variant="bodySmall" color={Colors.error}>{error}</Text> : null}
            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : (
                <>
                  <Text style={styles.primaryBtnText}>Create account</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Welcome
  welcomeRoot: { flex: 1, backgroundColor: Colors.background },
  welcomeImage: {
    height: SCREEN_HEIGHT * 0.45,
    width: '100%',
  },
  welcomeImageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  brandBar: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPaddingH,
  },
  brandText: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  welcomeCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    marginTop: -32,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    gap: Spacing[3],
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing[2],
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  eyebrowText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1.5,
    color: Colors.onSurface,
  },
  welcomeTitle: {
    color: Colors.primary,
    letterSpacing: -1.5,
    marginTop: Spacing[2],
  },
  welcomeBody: {
    lineHeight: 24,
    marginTop: Spacing[1],
  },
  welcomeFooter: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: Spacing[5],
    marginTop: Spacing[6],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.primary,
  },
  welcomeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.full,
    ...Shadows.primary,
  },
  nextBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },

  // Forms
  formRoot: { flex: 1, backgroundColor: Colors.background },
  formScroll: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPaddingH,
    gap: Spacing[6],
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    alignSelf: 'flex-start',
  },
  formBrand: { alignItems: 'center', gap: Spacing[2] },
  formBrandText: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
    letterSpacing: -1,
  },
  formCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    gap: Spacing[4],
    ...Shadows.md,
  },
  formTitle: { letterSpacing: -0.5 },
  input: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[4],
    fontFamily: Typography.fontBody, fontSize: Typography.size.base,
    color: Colors.onSurface,
  },
  otpInput: {
    fontSize: Typography.size['2xl'], letterSpacing: 16,
    fontWeight: Typography.weight.bold, paddingVertical: Spacing[5],
  },
  inputGroup: { gap: Spacing[2] },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing[5],
    ...Shadows.primary,
  },
  primaryBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },
});
