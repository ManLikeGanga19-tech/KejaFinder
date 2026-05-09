import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { ListingCard } from '../../src/components/listing/ListingCard';
import { apiFetch } from '../../src/lib/api';

interface Amenity { id: string; name: string; category: string; subcategory?: string; distanceKm?: number; rating?: number; isTopTier: boolean; }
interface AmenityGroup { category: string; items: Amenity[]; }
interface Area {
  id: string; slug: string; name: string; city: string; tags: string[];
  heroImageUrl?: string; localInsight?: string;
  areaScore: number; safetyRating: number; safetyLabel?: string; safetyNotes?: string;
  costTier?: string; rentRangeMin?: number; rentRangeMax?: number;
  mobilityScore?: number; walkabilityScore?: number;
  connectivityMins?: number; connectivityRoute?: string;
  investmentGrowthPct?: number; rentalYieldPct?: number; demandScore?: string;
  amenities: AmenityGroup[];
}

const CATEGORY_ICONS: Record<string, string> = {
  healthcare: '🏥', education: '🎓', retail: '🛒',
  transport: '🚌', recreation: '🌳', finance: '🏦', dining: '🍽️',
};

export default function AreaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState<Area | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'listings'>('overview');

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      apiFetch<{ area: Area }>(`/areas/${slug}`, { auth: true }).then(d => setArea(d.area)),
      apiFetch<{ listings: any[] }>(`/areas/${slug}/listings?limit=6`).then(d => setListings(d.listings)),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!area) return (
    <View style={styles.loader}>
      <Text>Area not found</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing[4] }}>
        <Text color={Colors.secondary}>Go back</Text>
      </TouchableOpacity>
    </View>
  );

  const scoreColor = area.safetyRating >= 75 ? Colors.success : area.safetyRating >= 50 ? Colors.warning : Colors.error;

  return (
    <View style={styles.root}>
      <View style={[styles.heroHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.heroTitle}>
          <Text variant="headlineMedium" style={{ letterSpacing: -0.5 }}>{area.name}</Text>
          <Text variant="bodySmall" color={Colors.onSurfaceVariant}>{area.city}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
          <Text style={[styles.scoreNum, { color: scoreColor }]}>{area.areaScore.toFixed(1)}</Text>
          <Text style={[styles.scoreMax, { color: scoreColor }]}>/10</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['overview', 'amenities', 'listings'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text variant="labelLarge" color={activeTab === tab ? Colors.primary : Colors.onSurfaceVariant}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing[10] }} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.scoreGrid}>
              <ScoreCard label="Safety" value={`${area.safetyRating}%`} sub={area.safetyLabel} color={Colors.success} />
              {area.mobilityScore != null && <ScoreCard label="Transit" value={`${area.mobilityScore}/10`} color={Colors.secondary} />}
              {area.walkabilityScore != null && <ScoreCard label="Walkability" value={`${area.walkabilityScore}/10`} color={Colors.secondary} />}
            </View>

            <View style={styles.card}>
              <Text variant="titleSmall">Cost of living</Text>
              <Row label="Price tier" value={area.costTier ?? '—'} />
              {area.rentRangeMin != null && area.rentRangeMax != null && (
                <Row label="Rent range" value={`KES ${(area.rentRangeMin / 1000).toFixed(0)}k – ${(area.rentRangeMax / 1000).toFixed(0)}k/mo`} />
              )}
            </View>

            {(area.connectivityMins != null || area.connectivityRoute) && (
              <View style={styles.card}>
                <Text variant="titleSmall">Getting around</Text>
                {area.connectivityMins != null && <Row label="CBD commute" value={`${area.connectivityMins} mins`} />}
                {area.connectivityRoute && <Text variant="bodySmall" color={Colors.onSurfaceVariant}>{area.connectivityRoute}</Text>}
              </View>
            )}

            {(area.investmentGrowthPct != null || area.rentalYieldPct != null) && (
              <View style={styles.card}>
                <Text variant="titleSmall">Investment outlook</Text>
                {area.investmentGrowthPct != null && <Row label="Annual growth" value={`+${area.investmentGrowthPct}%`} />}
                {area.rentalYieldPct != null && <Row label="Rental yield" value={`${area.rentalYieldPct}%`} />}
                {area.demandScore && <Row label="Demand" value={area.demandScore} />}
              </View>
            )}

            {area.localInsight && (
              <View style={[styles.card, { backgroundColor: Colors.primaryFixed }]}>
                <Text variant="labelSmall" color={Colors.primary}>LOCAL INSIGHT</Text>
                <Text variant="bodyMedium" style={{ lineHeight: 22, marginTop: Spacing[2] }}>{area.localInsight}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'amenities' && (
          <View style={styles.tabContent}>
            {area.amenities.length === 0 ? (
              <View style={styles.empty}><Text variant="bodyMedium" color={Colors.onSurfaceVariant}>No amenity data yet.</Text></View>
            ) : area.amenities.map(group => (
              <View key={group.category} style={styles.amenityGroup}>
                <View style={styles.amenityGroupHeader}>
                  <Text style={{ fontSize: 18 }}>{CATEGORY_ICONS[group.category] ?? '📍'}</Text>
                  <Text variant="titleSmall">{group.category.charAt(0).toUpperCase() + group.category.slice(1)} ({group.items.length})</Text>
                </View>
                {group.items.map(item => (
                  <View key={item.id} style={styles.amenityRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyMedium">{item.name}</Text>
                      {item.subcategory && <Text variant="labelSmall" color={Colors.onSurfaceVariant}>{item.subcategory}</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                      {item.distanceKm != null && (
                        <Text variant="bodySmall" color={Colors.onSurfaceVariant}>
                          {item.distanceKm < 1 ? `${(item.distanceKm * 1000).toFixed(0)}m` : `${item.distanceKm.toFixed(1)}km`}
                        </Text>
                      )}
                      {item.isTopTier && (
                        <View style={{ backgroundColor: Colors.primaryFixed, paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: BorderRadius.full }}>
                          <Text variant="labelSmall" color={Colors.primary}>Top</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'listings' && (
          <View style={styles.tabContent}>
            {listings.length === 0 ? (
              <View style={styles.empty}><Text variant="bodyMedium" color={Colors.onSurfaceVariant}>No active listings.</Text></View>
            ) : listings.map(l => <ListingCard key={l.id} {...l} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ScoreCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <View style={[styles.scoreCard, { borderColor: color + '40' }]}>
      <Text variant="labelSmall" color={Colors.onSurfaceVariant}>{label}</Text>
      <Text variant="titleLarge" style={{ color }}>{value}</Text>
      {sub && <Text variant="labelSmall" color={Colors.onSurfaceVariant}>{sub}</Text>}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>{label}</Text>
      <Text variant="titleSmall">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  heroHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[4],
    backgroundColor: Colors.surfaceContainerLowest,
    gap: Spacing[3], ...Shadows.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: Colors.onSurface },
  heroTitle: { flex: 1, gap: 2 },
  scoreBadge: {
    flexDirection: 'row', alignItems: 'baseline',
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: BorderRadius.xl, gap: 2,
  },
  scoreNum: {
    fontFamily: Typography.fontHeadline, fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold, letterSpacing: -1,
  },
  scoreMax: {
    fontFamily: Typography.fontBody, fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  tab: {
    flex: 1, paddingVertical: Spacing[3], alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: Colors.transparent,
  },
  tabActive: { borderBottomColor: Colors.primary },
  scroll: { flex: 1 },
  tabContent: { padding: Layout.screenPaddingH, gap: Spacing[4] },
  empty: { alignItems: 'center', paddingVertical: Spacing[12] },
  scoreGrid: { flexDirection: 'row', gap: Spacing[3] },
  scoreCard: {
    flex: 1, backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl, borderWidth: 1.5,
    padding: Spacing[4], gap: Spacing[1], alignItems: 'center',
    ...Shadows.sm,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4], gap: Spacing[3],
    ...Shadows.sm,
  },
  amenityGroup: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden', ...Shadows.sm,
  },
  amenityGroupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
  },
  amenityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
  },
});
