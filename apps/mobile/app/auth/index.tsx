import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { apiFetch } from '../../src/lib/api';

type Mode = 'landing' | 'phone' | 'otp' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('landing');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalize = (raw: string) =>
    raw.startsWith('+') ? raw : raw.startsWith('0') ? `+254${raw.slice(1)}` : `+${raw}`;

  const handlePhoneSubmit = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!/^\+?254\d{9}$|^07\d{8}$|^01\d{8}$/.test(cleaned)) {
      setError('Enter a valid +254 number');
      return;
    }
    setError(''); setLoading(true);
    try {
      // Stub: integrate Firebase Phone Auth on the client to send OTP
      setMode('otp');
    } catch (err: any) { setError(err.message ?? 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleOtpSubmit = async () => {
    if (otp.length < 4) { setError('Enter the code from SMS'); return; }
    setError(''); setLoading(true);
    try {
      // Stub: verify OTP via Firebase, get ID token
      const fakeToken = 'firebase-id-token-stub';
      await AsyncStorage.setItem('firebase_token', fakeToken);
      // Try sync; if 404, go to register
      try {
        await apiFetch('/auth/sync', { method: 'POST', body: { firebaseIdToken: fakeToken } });
        router.replace('/(tabs)' as any);
      } catch {
        setMode('register');
      }
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

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Ionicons name="home" size={40} color={Colors.white} />
          </View>
          <Text variant="headlineLarge" style={styles.brandName}>KejaFinder</Text>
          <Text variant="bodyMedium" style={styles.tagline}>Find your perfect home in Kenya</Text>
        </View>

        {mode === 'landing' && (
          <View style={styles.card}>
            <Text variant="titleLarge">Get started</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={{ lineHeight: 22 }}>
              Sign in with your Safaricom or Airtel number. No password needed.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setMode('phone')} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Continue with phone</Text>
            </TouchableOpacity>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text variant="labelSmall" color={Colors.onSurfaceVariant}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => router.replace('/(tabs)' as any)}>
              <Text style={styles.ghostBtnText}>Browse listings without signing in</Text>
            </TouchableOpacity>
            <Text variant="bodySmall" color={Colors.onSurfaceVariant} style={{ textAlign: 'center', lineHeight: 18 }}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        )}

        {mode === 'phone' && (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setMode('landing')}>
              <Text variant="labelLarge" color={Colors.secondary}>← Back</Text>
            </TouchableOpacity>
            <Text variant="titleLarge">Enter your phone</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>We'll send a one-time code to verify your number.</Text>
            <TextInput
              style={styles.input}
              value={phone} onChangeText={v => { setPhone(v); setError(''); }}
              placeholder="0712 345 678" placeholderTextColor={Colors.onSurfaceVariant}
              keyboardType="phone-pad" autoFocus maxLength={13}
            />
            {error ? <Text variant="bodySmall" color={Colors.error}>{error}</Text> : null}
            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={handlePhoneSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryBtnText}>Send code</Text>}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'otp' && (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setMode('phone')}>
              <Text variant="labelLarge" color={Colors.secondary}>← Change number</Text>
            </TouchableOpacity>
            <Text variant="titleLarge">Enter the code</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>We sent a 6-digit code to {phone}</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={otp} onChangeText={v => { setOtp(v); setError(''); }}
              placeholder="• • • • • •" placeholderTextColor={Colors.onSurfaceVariant}
              keyboardType="number-pad" maxLength={6} autoFocus textAlign="center"
            />
            {error ? <Text variant="bodySmall" color={Colors.error}>{error}</Text> : null}
            <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.6 }]} onPress={handleOtpSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryBtnText}>Verify</Text>}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'register' && (
          <View style={styles.card}>
            <Text variant="titleLarge">Complete your profile</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>Just a few details to get you started.</Text>
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
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryBtnText}>Create account</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Layout.screenPaddingH, gap: Spacing[8] },
  brand: { alignItems: 'center', gap: Spacing[3] },
  logoMark: {
    width: 80, height: 80, borderRadius: BorderRadius['2xl'],
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { color: Colors.white, letterSpacing: -1 },
  tagline: { color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6], gap: Spacing[4],
    ...Shadows.xl,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[4],
    fontFamily: Typography.fontBody, fontSize: Typography.size.base,
    color: Colors.onSurface,
    borderWidth: 1.5, borderColor: Colors.outlineVariant,
  },
  otpInput: {
    fontSize: Typography.size['2xl'], letterSpacing: 16,
    fontWeight: Typography.weight.bold, paddingVertical: Spacing[5],
  },
  inputGroup: { gap: Spacing[2] },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl, paddingVertical: Spacing[5],
    alignItems: 'center', ...Shadows.primary,
  },
  primaryBtnText: {
    fontFamily: Typography.fontBody, fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold, color: Colors.white,
  },
  ghostBtn: {
    borderRadius: BorderRadius.xl, paddingVertical: Spacing[4],
    alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.outlineVariant,
  },
  ghostBtnText: {
    fontFamily: Typography.fontBody, fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium, color: Colors.onSurfaceVariant,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.outlineVariant },
});
