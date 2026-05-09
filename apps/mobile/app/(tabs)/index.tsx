import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Eyebrow } from '../../src/components/ui/Eyebrow';
import { FeaturedCard } from '../../src/components/listing/FeaturedCard';
import { AreaBentoCard } from '../../src/components/area/AreaBentoCard';
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
  areaSqft?: number;
  propertyType: string;
  city: string;
  area?: { name: string; slug: string };
  isLocked: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  unlockPriceKes: number;
  photos: { url: string; isCover: boolean }[];
}

type Filter = 'budget' | 'bedrooms' | 'property';

export default function ExploreScreen() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>('budget');

  useEffect(() => {
    Promise.all([
      apiFetch<{ areas: Area[] }>('/areas/recommended').then(d => setAreas(d.areas)).catch(() => {}),
      apiFetch<{ listings: Listing[] }>('/listings/featured').then(d => setFeatured(d.listings)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero title ── */}
        <View style={styles.hero}>
          <Text variant="headlineLarge" style={styles.heroTitle}>
            Find your urban{'\n'}sanctuary.
          </Text>
          <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>
            Curated living spaces in the heart of Nairobi.
          </Text>
        </View>

        {/* ── Search + Filter row ── */}
        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/explore' as any)}
          >
            <Ionicons name="search-outline" size={18} color={Colors.onSurfaceVariant} />
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} numberOfLines={1}>
              Search by location, price...
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={18} color={Colors.white} />
            <Text style={styles.filterBtnText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* ── Filter chips ── */}
        <View style={styles.chipsRow}>
          {(['budget', 'bedrooms', 'property'] as const).map(key => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, activeFilter === key && styles.chipActive]}
              onPress={() => setActiveFilter(key)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={key === 'budget' ? 'cash-outline' : key === 'bedrooms' ? 'bed-outline' : 'home-outline'}
                size={14}
                color={activeFilter === key ? Colors.white : Colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: activeFilter === key ? Colors.white : Colors.onSurfaceVariant },
                ]}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Featured Listings ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Eyebrow>Handpicked for you</Eyebrow>
              <Text variant="headlineSmall" style={{ marginTop: 4 }}>Featured Listings</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore' as any)}>
              <Text variant="labelLarge" color={Colors.secondary}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={featured}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              ItemSeparatorComponent={() => <View style={{ width: Spacing[3] }} />}
              renderItem={({ item }) => <FeaturedCard {...item} />}
            />
          )}
        </View>

        {/* ── Recommended Areas ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Eyebrow>Live where it matters</Eyebrow>
              <Text variant="headlineSmall" style={{ marginTop: 4 }}>Recommended Areas</Text>
            </View>
          </View>

          <View style={styles.bentoGrid}>
            {areas[0] && (
              <AreaBentoCard slug={areas[0].slug} name={areas[0].name} size="large" style={{ flex: 1 }} />
            )}
            <View style={styles.bentoColumn}>
              {areas[1] && (
                <AreaBentoCard
                  slug={areas[1].slug}
                  name={areas[1].name}
                  badge="HOT SPOT"
                  trend="+12% demand"
                  size="small"
                />
              )}
              {areas[2] && (
                <AreaBentoCard slug={areas[2].slug} name={areas[2].name} size="small" />
              )}
            </View>
          </View>
        </View>

        {/* ── Unlock Area Intelligence promo ── */}
        <View style={styles.section}>
          <View style={styles.promoCard}>
            <View style={styles.promoIcon}>
              <Ionicons name="analytics" size={20} color={Colors.white} />
            </View>
            <Text variant="headlineSmall" style={styles.promoTitle}>
              Unlock Area{'\n'}Intelligence
            </Text>
            <Text variant="bodyMedium" style={styles.promoBody}>
              Get deep-dive data on safety, commute times, and local amenities for any neighborhood.
            </Text>
            <TouchableOpacity
              style={styles.promoBtn}
              onPress={() => router.push('/(tabs)/explore' as any)}
            >
              <Text style={styles.promoBtnText}>Explore Stats</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing[8] },

  // Hero
  hero: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[5],
    gap: Spacing[2],
  },
  heroTitle: {
    color: Colors.primary,
    letterSpacing: -1,
    lineHeight: 38,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPaddingH,
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.full,
    gap: Spacing[2],
    ...Shadows.primary,
  },
  filterBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPaddingH,
    gap: Spacing[2],
    marginBottom: Spacing[6],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
  },
  chipActive: {
    backgroundColor: Colors.secondary,
  },
  chipText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },

  // Section
  section: {
    marginBottom: Spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[4],
  },
  loader: {
    marginVertical: Spacing[8],
  },

  // Featured carousel
  featuredList: {
    paddingHorizontal: Layout.screenPaddingH,
  },

  // Bento grid
  bentoGrid: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPaddingH,
    gap: Spacing[3],
  },
  bentoColumn: {
    flex: 1,
    gap: Spacing[3],
  },

  // Promo
  promoCard: {
    marginHorizontal: Layout.screenPaddingH,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[6],
    gap: Spacing[3],
    ...Shadows.primary,
  },
  promoIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: {
    color: Colors.white,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  promoBody: {
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  promoBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
    marginTop: Spacing[2],
  },
  promoBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
});
