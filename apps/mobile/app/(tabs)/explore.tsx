import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, ActivityIndicator, SafeAreaView } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { apiFetch } from '../../src/lib/api';

interface Listing {
  id: string;
  slug: string;
  title: string;
  priceKes: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  city: string;
  area?: { name: string; slug: string };
  isLocked: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  unlockPriceKes: number;
  photos: { url: string; isCover: boolean }[];
}

export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = query ? `?q=${encodeURIComponent(query)}&limit=30` : '?limit=30';
      apiFetch<{ listings: Listing[] }>(`/listings${q}`)
        .then(d => setListings(d.listings))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Explore</Text>
        <View style={styles.search}>
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Search areas, properties..."
            placeholderTextColor={Colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing[8] }} />
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
    gap: Spacing[4],
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
    ...Shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.onSurface,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[5],
    paddingBottom: Layout.bottomTabHeight + Spacing[8],
  },
});
