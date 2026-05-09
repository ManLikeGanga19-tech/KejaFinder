import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { apiFetch } from '../../src/lib/api';

interface Area {
  id: string;
  slug: string;
  name: string;
  safetyRating: number;
  costTier: string;
  rentRangeMin: number;
  rentRangeMax: number;
  activeListingsCount: number;
}

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

export default function HomeScreen() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ areas: Area[] }>('/areas/recommended').then(d => setAreas(d.areas)).catch(() => {}),
      apiFetch<{ listings: Listing[] }>('/listings/featured').then(d => setFeatured(d.listings)).catch(() => {}),
      apiFetch<{ listings: Listing[] }>('/listings?limit=10').then(d => setListings(d.listings)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text variant="labelSmall" color={Colors.onSurfaceVariant}>Good morning</Text>
            <Text variant="headlineMedium">Find your home</Text>
          </View>
          <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/(tabs)/notifications' as any)}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/explore' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>
            Search by area, property type...
          </Text>
        </TouchableOpacity>

        {featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge">Featured</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore' as any)}>
                <Text variant="labelLarge" color={Colors.secondary}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featured}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              renderItem={({ item }) => (
                <View style={styles.featuredCard}>
                  <ListingCard {...item} />
                </View>
              )}
            />
          </View>
        )}

        {areas.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge">Explore areas</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore' as any)}>
                <Text variant="labelLarge" color={Colors.secondary}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.areaGrid}>
              {areas.slice(0, 4).map(area => (
                <TouchableOpacity
                  key={area.id}
                  style={styles.areaCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/area/${area.slug}` as any)}
                >
                  <View style={styles.areaTop}>
                    <Text variant="titleSmall">{area.name}</Text>
                    <View style={styles.safetyBadge}>
                      <Text style={styles.safetyText}>{area.safetyRating}%</Text>
                    </View>
                  </View>
                  <Text variant="bodySmall">{area.costTier} · {area.activeListingsCount} listings</Text>
                  <Text variant="labelSmall" style={styles.rentRange}>
                    KES {(area.rentRangeMin / 1000).toFixed(0)}k – {(area.rentRangeMax / 1000).toFixed(0)}k/mo
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge">Recent listings</Text>
          </View>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : (
            listings.map(listing => (
              <ListingCard key={listing.id} {...listing} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Layout.bottomTabHeight + Spacing[8] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[4],
  },
  notifButton: {
    width: 44, height: 44, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.sm,
  },
  notifIcon: { fontSize: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[6],
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
    ...Shadows.sm,
  },
  searchIcon: { fontSize: 18 },
  section: { marginBottom: Spacing[8] },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[4],
  },
  featuredList: { paddingHorizontal: Layout.screenPaddingH, gap: Spacing[3] },
  featuredCard: { width: 300 },
  areaGrid: {
    paddingHorizontal: Layout.screenPaddingH,
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing[3],
  },
  areaCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[1],
    ...Shadows.sm,
  },
  areaTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing[1],
  },
  safetyBadge: {
    backgroundColor: Colors.successContainer,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  safetyText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.success,
  },
  rentRange: {
    color: Colors.secondary,
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: Typography.size.xs,
  },
  loader: { marginTop: Spacing[8] },
});
