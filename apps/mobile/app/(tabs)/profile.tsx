import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Layout } from '../../src/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
import { Text } from '../../src/components/ui/Text';
import { apiFetch } from '../../src/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    apiFetch<{ user: User }>('/users/me', { auth: true })
      .then(d => setUser(d.user))
      .catch(() => {});
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('firebase_token');
    router.replace('/auth' as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Profile</Text>
        </View>

        {user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
            <Text variant="titleLarge">{user.name}</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>{user.email}</Text>
            <Text variant="bodySmall" color={Colors.onSurfaceVariant}>{user.phone}</Text>
          </View>
        ) : (
          <View style={styles.profileCard}>
            <Text variant="titleSmall">Sign in to access your profile</Text>
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => router.push('/auth' as any)}
            >
              <Text style={styles.signInText}>Sign in / Register</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.menu}>
          <MenuRow iconName="heart-outline" label="Saved listings" onPress={() => router.push('/(tabs)/saved' as any)} />
          <MenuRow iconName="lock-open-outline" label="Unlocked listings" onPress={() => {}} />
          <MenuRow iconName="card-outline" label="Payment history" onPress={() => {}} />
          <MenuRow iconName="business-outline" label="Become an agent" onPress={() => {}} />
          <MenuRow iconName="settings-outline" label="Settings" onPress={() => {}} />
          <MenuRow iconName="document-text-outline" label="Terms & Privacy" onPress={() => {}} />
          {user && <MenuRow iconName="log-out-outline" label="Sign out" onPress={logout} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({ iconName, label, onPress }: { iconName: IconName; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={iconName} size={22} color={Colors.primary} />
      <Text variant="bodyLarge" style={{ flex: 1 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    paddingBottom: Spacing[8],
  },
  header: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[5],
  },
  profileCard: {
    margin: Layout.screenPaddingH,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[2],
    ...Shadows.sm,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  avatarText: {
    fontSize: 36, fontWeight: '700', color: Colors.primary,
  },
  signInBtn: {
    marginTop: Spacing[3],
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
  },
  signInText: { color: Colors.white, fontWeight: '700' },
  menu: {
    marginHorizontal: Layout.screenPaddingH,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
});
