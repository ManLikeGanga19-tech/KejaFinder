import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { Colors, Spacing, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { apiFetch } from '../../src/lib/api';

export default function SavedScreen() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ listings: any[] }>('/users/me/saved-listings', { auth: true })
      .then(d => setListings(d.listings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Saved</Text>
        <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>
          {listings.length} saved listings
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing[8] }} />
        ) : listings.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="titleMedium">No saved listings yet</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={{ marginTop: Spacing[2] }}>
              Tap the heart icon on any listing to save it for later.
            </Text>
          </View>
        ) : (
          listings.map(l => <ListingCard key={l.id} {...l} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[5],
    gap: Spacing[1],
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Layout.bottomTabHeight + Spacing[8],
  },
  empty: { alignItems: 'center', paddingVertical: Spacing[12] },
});
