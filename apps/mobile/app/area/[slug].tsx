import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, ImageBackground, Image, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Eyebrow } from '../../src/components/ui/Eyebrow';
import { RadialScore } from '../../src/components/area/RadialScore';
import { apiFetch } from '../../src/lib/api';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Amenity {
  id: string; name: string; category: string; subcategory?: string;
  distanceKm?: number; rating?: number; isTopTier: boolean;
}
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

const CATEGORY_ICONS: Record<string, IoniconName> = {
  healthcare: 'medkit-outline',
  education: 'school-outline',
  retail: 'cart-outline',
  transport: 'bus-outline',
  recreation: 'leaf-outline',
  finance: 'cash-outline',
  dining: 'restaurant-outline',
};

const CATEGORY_LABELS: Record<string, string> = {
  healthcare: 'Healthcare',
  education: 'Education',
  retail: 'Retail & Dining',
  dining: 'Retail & Dining',
  transport: 'Transport',
  recreation: 'Recreation',
  finance: 'Finance',
};

const AREA_HERO: Record<string, string> = {
  kilimani: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80',
  westlands: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1600&q=80',
  lavington: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1600&q=80',
  kileleshwa: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1600&q=80',
  'south-b': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80',
};

export default function AreaScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    apiFetch<{ area: Area }>(`/areas/${slug}`, { auth: true })
      .then(d => setArea(d.area))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }
  if (!area) {
    return (
      <View style={styles.loader}>
        <Text variant="bodyMedium">Area not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing[4] }}>
          <Text variant="labelLarge" color={Colors.primary}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const heroImage = area.heroImageUrl ?? AREA_HERO[area.slug] ?? AREA_HERO.kilimani;
  const safetyColor = area.safetyRating >= 75 ? Colors.success : area.safetyRating >= 50 ? Colors.warning : Colors.error;

  return (
    <View style={styles.root}>
      <AppHeader
        showBack
        onBack={() => router.back()}
        showMenu={false}
        rightSlot={
          <View style={styles.scoreChip}>
            <Ionicons name="star" size={12} color={Colors.primary} />
            <Text style={styles.scoreText}>{area.areaScore.toFixed(1)} Area Score</Text>
          </View>
        }
        trailing="none"
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing[8] }]}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        overScrollMode="never"
      >
        {/* ── Hero title ── */}
        <View style={styles.hero}>
          <Text variant="displayMedium" style={styles.areaTitle}>
            {`The ${area.name}\nUrban Sanctuary`}
          </Text>

          <View style={styles.tagsRow}>
            {area.tags.slice(0, 4).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Hero image with local insight overlay ── */}
        <View style={styles.heroImageWrap}>
          <ImageBackground source={{ uri: heroImage }} style={styles.heroImage} imageStyle={{ borderRadius: BorderRadius['2xl'] }}>
            {area.localInsight && (
              <View style={styles.insightOverlay}>
                <View>
                  <Eyebrow color={Colors.white}>Local Insight</Eyebrow>
                  <Text style={styles.insightText}>{area.localInsight}</Text>
                </View>
              </View>
            )}
          </ImageBackground>
        </View>

        {/* ── Safety Rating card ── */}
        <View style={styles.card}>
          <Eyebrow>Safety Rating</Eyebrow>
          <View style={styles.safetyBlock}>
            <RadialScore
              value={area.safetyRating}
              color={safetyColor}
              size={140}
              label={area.safetyLabel ?? 'EXCELLENT'}
            />
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={styles.safetyText}>
              {area.safetyNotes ?? 'Among the lowest crime rates in Nairobi for 24 consecutive months.'}
            </Text>
          </View>
        </View>

        {/* ── Cost Index card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Eyebrow>Cost Index</Eyebrow>
              <Text variant="titleLarge" style={{ marginTop: 4, color: Colors.tertiaryContainer }}>
                {area.costTier ?? '$$'}
              </Text>
            </View>
            <View style={styles.tierPill}>
              <Ionicons name="trending-up" size={12} color={Colors.tertiaryContainer} />
              <Text style={styles.tierPillText}>Upper Tier</Text>
            </View>
          </View>

          <View style={styles.barRow}>
            <Text variant="bodySmall" color={Colors.onSurfaceVariant}>RENT</Text>
            <Text variant="bodySmall" color={Colors.onSurfaceVariant}>
              KES {area.rentRangeMin?.toLocaleString() ?? '—'} – {area.rentRangeMax?.toLocaleString() ?? '—'}
            </Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: '70%', backgroundColor: Colors.tertiaryFixedDim }]} />
          </View>
        </View>

        {/* ── Accessibility card ── */}
        {(area.mobilityScore != null || area.walkabilityScore != null) && (
          <View style={styles.card}>
            <Eyebrow>Accessibility</Eyebrow>
            <View style={styles.accessRow}>
              {area.mobilityScore != null && (
                <ScoreItem
                  icon="car-outline"
                  value={`${area.mobilityScore}/10`}
                  label="Vehicle Mobility"
                />
              )}
              {area.walkabilityScore != null && (
                <ScoreItem
                  icon="walk-outline"
                  value={`${area.walkabilityScore}/10`}
                  label="Walkability"
                />
              )}
            </View>
          </View>
        )}

        {/* ── Connectivity navy card ── */}
        {area.connectivityMins != null && (
          <View style={styles.connectivityCard}>
            <View style={styles.connectivityHeader}>
              <Eyebrow color="rgba(255,255,255,0.7)">Connectivity</Eyebrow>
              <Ionicons name="navigate" size={20} color="rgba(255,255,255,0.6)" />
            </View>
            <Text style={styles.connectivityMins}>{area.connectivityMins} mins</Text>
            {area.connectivityRoute && (
              <Text variant="bodyMedium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {area.connectivityRoute}
              </Text>
            )}
          </View>
        )}

        {/* ── Essential Amenities ── */}
        {area.amenities.length > 0 && (
          <View style={[styles.section, { gap: Spacing[3] }]}>
            <Text variant="headlineSmall" style={{ color: Colors.primary }}>Essential Amenities</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>
              Detailed data on the infrastructure that powers your daily lifestyle in {area.name}.
            </Text>

            <View style={styles.amenityActionRow}>
              <TouchableOpacity style={styles.compareBtn} activeOpacity={0.85}>
                <Text style={styles.compareBtnText}>Compare Area</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewPropsBtn}
                activeOpacity={0.85}
                onPress={() => router.push(`/(tabs)/explore?area=${area.slug}` as any)}
              >
                <Text style={styles.viewPropsBtnText}>View Properties</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {area.amenities.map(group => (
              <AmenityGroupCard key={group.category} group={group} />
            ))}
          </View>
        )}

        {/* ── Investment Intelligence banner ── */}
        {(area.investmentGrowthPct != null || area.rentalYieldPct != null) && (
          <View style={styles.investmentCard}>
            <View style={styles.investmentTopRow}>
              <Ionicons name="trending-up" size={20} color={Colors.white} />
              <Eyebrow color="rgba(255,255,255,0.7)">New Growth Metrics</Eyebrow>
            </View>
            <Text style={styles.investmentTitle}>Investment Intelligence</Text>
            <Text variant="bodyMedium" style={styles.investmentBody}>
              Property values in {area.name} have seen a {area.investmentGrowthPct ? `${area.investmentGrowthPct}%` : 'strong'} year-on-year shift toward sustainable development — making it a primary choice for long-term equity builders.
            </Text>

            <View style={styles.investmentStatsRow}>
              {area.rentalYieldPct != null && (
                <InvestStat label="Rental Yield" value={`+${area.rentalYieldPct}%`} />
              )}
              {area.demandScore && (
                <InvestStat label="Demand Score" value={area.demandScore} />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Components ─────────────────────────────────────────────────────────────

function ScoreItem({ icon, value, label }: { icon: IoniconName; value: string; label: string }) {
  return (
    <View style={styles.scoreItem}>
      <View style={styles.scoreItemIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View>
        <Text variant="titleMedium">{value}</Text>
        <Text variant="bodySmall" color={Colors.onSurfaceVariant}>{label}</Text>
      </View>
    </View>
  );
}

function AmenityGroupCard({ group }: { group: AmenityGroup }) {
  return (
    <View style={styles.amenityGroup}>
      <View style={styles.amenityGroupHeader}>
        <View style={styles.amenityGroupIcon}>
          <Ionicons name={CATEGORY_ICONS[group.category] ?? 'location-outline'} size={16} color={Colors.primary} />
        </View>
        <Text variant="titleSmall">{CATEGORY_LABELS[group.category] ?? group.category}</Text>
      </View>
      {group.items.map((item, idx) => (
        <View key={item.id} style={[styles.amenityRow, idx === 0 && { borderTopWidth: 0 }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyMedium">{item.name}</Text>
            {item.subcategory && (
              <Text variant="bodySmall" color={Colors.onSurfaceVariant}>{item.subcategory}</Text>
            )}
          </View>
          <View style={styles.amenityRight}>
            {item.rating != null && (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={10} color={Colors.tertiaryContainer} />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            )}
            {item.distanceKm != null && (
              <Text variant="labelSmall" color={Colors.onSurfaceVariant}>
                {item.distanceKm < 1 ? `${(item.distanceKm * 1000).toFixed(0)}m` : `${item.distanceKm.toFixed(1)}km`}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

function InvestStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.investStat}>
      <Text style={styles.investStatValue}>{value}</Text>
      <Text style={styles.investStatLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  scroll: { gap: Spacing[4], paddingHorizontal: 0 },

  // Score chip in header
  scoreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  scoreText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  // Hero
  hero: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[2],
    gap: Spacing[3],
  },
  areaTitle: {
    color: Colors.primary,
    letterSpacing: -1,
    lineHeight: 44,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  tag: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.secondary,
  },

  // Hero image
  heroImageWrap: {
    paddingHorizontal: Layout.screenPaddingH,
  },
  heroImage: {
    height: 180,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    justifyContent: 'flex-end',
    ...Shadows.md,
  },
  insightOverlay: {
    backgroundColor: 'rgba(0, 35, 111, 0.9)',
    padding: Spacing[4],
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  insightText: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    marginHorizontal: Layout.screenPaddingH,
    gap: Spacing[3],
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Safety
  safetyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  safetyText: {
    flex: 1,
    lineHeight: 20,
  },

  // Cost
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  tierPillText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    color: Colors.tertiaryContainer,
    letterSpacing: 1,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing[2],
  },
  bar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Accessibility
  accessRow: {
    flexDirection: 'row',
    gap: Spacing[6],
    marginTop: Spacing[2],
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flex: 1,
  },
  scoreItemIcon: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Connectivity navy
  connectivityCard: {
    marginHorizontal: Layout.screenPaddingH,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    gap: Spacing[2],
    ...Shadows.primary,
  },
  connectivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectivityMins: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['4xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.white,
    letterSpacing: -1,
  },

  // Section
  section: {
    paddingHorizontal: Layout.screenPaddingH,
  },

  // Amenities action
  amenityActionRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginVertical: Spacing[3],
  },
  compareBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  compareBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.onSurface,
  },
  viewPropsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primary,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
    ...Shadows.primary,
  },
  viewPropsBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },

  // Amenity group
  amenityGroup: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
    marginBottom: Spacing[3],
  },
  amenityGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  amenityGroupIcon: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  amenityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.tertiaryContainer,
  },

  // Investment
  investmentCard: {
    marginHorizontal: Layout.screenPaddingH,
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    gap: Spacing[3],
    ...Shadows.primary,
  },
  investmentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  investmentTitle: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  investmentBody: {
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  investmentStatsRow: {
    flexDirection: 'row',
    gap: Spacing[6],
    marginTop: Spacing[3],
  },
  investStat: {
    flex: 1,
  },
  investStatValue: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  investStatLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
