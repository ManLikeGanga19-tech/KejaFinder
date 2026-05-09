import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { apiFetch } from '../../src/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Photo { id: string; url: string; isCover: boolean; }
interface AreaPreview { slug: string; name: string; safetyRating: number; safetyLabel: string; costTier: string; rentRangeMin: number; rentRangeMax: number; mobilityScore: number; }
interface AgentPublic { id: string; displayName: string; companyName?: string; logoUrl?: string; phone?: string; email?: string; }
interface Listing {
  id: string; slug: string; title: string;
  descriptionTeaser: string; descriptionFull?: string;
  propertyType: string; priceKes: number; pricePeriod: string;
  bedrooms: number; bathrooms: number; areaSqft?: number;
  furnishing: string; parking: number; petsAllowed: boolean; wifi: boolean;
  amenities: string[]; city: string;
  address?: string; coordinates?: { lat: number; lng: number };
  caretakerName?: string; caretakerPhone?: string;
  availableFrom?: string; depositMonths: number; unlockPriceKes: number;
  isVerified: boolean; isFeatured: boolean;
  isLocked: boolean; isUnlockedByMe: boolean; isSavedByMe: boolean;
  viewCount: number; unlockCount: number;
  photos: Photo[]; area?: AreaPreview; agent: AgentPublic;
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ listing: Listing }>(`/listings/${id}`, { auth: true })
      .then(d => setListing(d.listing))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!listing) return;
    try {
      const method = listing.isSavedByMe ? 'DELETE' : 'POST';
      await apiFetch(`/users/me/saved-listings/${id}`, { method, auth: true });
      setListing(prev => prev ? { ...prev, isSavedByMe: !prev.isSavedByMe } : null);
    } catch {}
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!listing) return (
    <View style={styles.loader}>
      <Text>Listing not found</Text>
      <Button label="Go back" onPress={() => router.back()} style={{ marginTop: Spacing[4] }} />
    </View>
  );

  const isUnlocked = listing.isUnlockedByMe;

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.photoCarousel}>
          <FlatList
            data={listing.photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={p => p.id}
            onScroll={e => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
            scrollEventThrottle={16}
            renderItem={({ item }) => <Image source={{ uri: item.url }} style={styles.photo} resizeMode="cover" />}
            ListEmptyComponent={<View style={[styles.photo, styles.photoPlaceholder]} />}
          />
          <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={Colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={handleSave}>
              <Ionicons
                name={listing.isSavedByMe ? 'heart' : 'heart-outline'}
                size={20}
                color={listing.isSavedByMe ? Colors.error : Colors.onSurface}
              />
            </TouchableOpacity>
          </View>
          {listing.photos.length > 1 && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCountText}>{photoIndex + 1}/{listing.photos.length}</Text>
            </View>
          )}
          <View style={styles.photoBadges}>
            {listing.isFeatured && <Badge label="Featured" variant="featured" />}
            {listing.isVerified && <Badge label="Verified" variant="verified" />}
            {listing.isLocked && !isUnlocked && <Badge label="Locked" variant="locked" />}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <Text variant="headlineMedium" style={styles.title}>{listing.title}</Text>
              <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>
                {listing.area?.name ?? listing.city}
                {listing.address ? ` · ${listing.address}` : ''}
              </Text>
            </View>
            <View style={styles.priceBlock}>
              <Text variant="price">KES {listing.priceKes.toLocaleString()}</Text>
              <Text variant="labelSmall" color={Colors.onSurfaceVariant}>/month</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatBlock iconName="bed-outline" value={`${listing.bedrooms}`} label="Beds" />
            <StatBlock iconName="water-outline" value={`${listing.bathrooms}`} label="Baths" />
            {listing.areaSqft ? <StatBlock iconName="resize-outline" value={`${listing.areaSqft}`} label="sqft" /> : null}
            <StatBlock iconName="car-outline" value={`${listing.parking}`} label="Parking" />
          </View>

          <Divider />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>About this property</Text>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={styles.description}>
              {isUnlocked ? (listing.descriptionFull ?? listing.descriptionTeaser) : listing.descriptionTeaser}
            </Text>
            {listing.isLocked && !isUnlocked && (
              <View style={styles.lockedHint}>
                <Ionicons name="lock-closed" size={16} color={Colors.primary} style={{ marginRight: Spacing[2] }} />
                <Text style={styles.lockedHintText}>
                  Full description, exact address, and agent contacts revealed after unlock
                </Text>
              </View>
            )}
          </View>

          <Divider />

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Listed by</Text>
            <View style={styles.agentCard}>
              <View style={styles.agentAvatar}>
                {listing.agent.logoUrl ? (
                  <Image source={{ uri: listing.agent.logoUrl }} style={styles.agentAvatarImg} />
                ) : (
                  <Text style={styles.agentAvatarInitial}>{listing.agent.displayName.charAt(0)}</Text>
                )}
              </View>
              <View style={styles.agentInfo}>
                <Text variant="titleSmall">{listing.agent.displayName}</Text>
                {listing.agent.companyName && (
                  <Text variant="bodySmall" color={Colors.onSurfaceVariant}>{listing.agent.companyName}</Text>
                )}
              </View>
              {isUnlocked && listing.agent.phone && (
                <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${listing.agent.phone}`)}>
                  <Ionicons name="call-outline" size={14} color={Colors.success} />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>
              )}
            </View>
            {isUnlocked && listing.caretakerName && (
              <View style={[styles.agentCard, { marginTop: Spacing[3] }]}>
                <View style={styles.agentAvatar}>
                  <Text style={styles.agentAvatarInitial}>{listing.caretakerName.charAt(0)}</Text>
                </View>
                <View style={styles.agentInfo}>
                  <Text variant="titleSmall">{listing.caretakerName}</Text>
                  <Text variant="bodySmall" color={Colors.onSurfaceVariant}>Caretaker</Text>
                </View>
                {listing.caretakerPhone && (
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${listing.caretakerPhone}`)}>
                    <Ionicons name="call-outline" size={14} color={Colors.success} />
                    <Text style={styles.callBtnText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + Spacing[4] }]}>
        {isUnlocked ? (
          <View style={styles.unlockedBar}>
            <View style={styles.unlockedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.unlockedBadgeText}>Unlocked</Text>
            </View>
            {listing.agent.phone && (
              <TouchableOpacity style={styles.ctaCallBtn} onPress={() => Linking.openURL(`tel:${listing.agent.phone}`)}>
                <Ionicons name="call" size={16} color={Colors.white} />
                <Text style={styles.ctaCallText}>Call agent</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.lockedBar}>
            <View style={styles.lockedBarInfo}>
              <Text variant="labelSmall" color={Colors.onSurfaceVariant}>Unlock full details</Text>
              <Text variant="titleSmall">KES {listing.unlockPriceKes} via M-Pesa</Text>
            </View>
            <TouchableOpacity style={styles.unlockBtn} activeOpacity={0.85} onPress={() => router.push(`/payment/${id}` as any)}>
              <Ionicons name="lock-open" size={16} color={Colors.white} />
              <Text style={styles.unlockBtnText}>Unlock now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function StatBlock({ iconName, value, label }: { iconName: React.ComponentProps<typeof Ionicons>['name']; value: string; label: string }) {
  return (
    <View style={styles.statBlock}>
      <Ionicons name={iconName} size={20} color={Colors.primary} style={{ marginBottom: 4 }} />
      <Text variant="titleMedium">{value}</Text>
      <Text variant="labelSmall" color={Colors.onSurfaceVariant}>{label}</Text>
    </View>
  );
}

function Divider() { return <View style={styles.divider} />; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  scroll: { flex: 1 },
  photoCarousel: { height: 300, position: 'relative' },
  photo: { width: SCREEN_WIDTH, height: 300 },
  photoPlaceholder: { backgroundColor: Colors.surfaceContainerHigh },
  navBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
  },
  navBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.sm,
  },
  navIcon: { fontSize: 18 },
  photoCounter: {
    position: 'absolute', bottom: Spacing[3], right: Spacing[3],
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing[3], paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  photoCountText: {
    fontFamily: Typography.fontBody, fontSize: Typography.size.xs,
    color: Colors.white, fontWeight: Typography.weight.bold,
  },
  photoBadges: {
    position: 'absolute', bottom: Spacing[3], left: Spacing[3],
    flexDirection: 'row', gap: Spacing[2],
  },
  content: { padding: Layout.screenPaddingH, paddingTop: Spacing[5] },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Spacing[5], gap: Spacing[3],
  },
  titleLeft: { flex: 1, gap: Spacing[1] },
  title: { letterSpacing: -0.5 },
  priceBlock: { alignItems: 'flex-end' },
  statsGrid: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing[4],
    marginBottom: Spacing[5],
  },
  statBlock: { alignItems: 'center', gap: 2 },
  statIcon: { fontSize: 20, marginBottom: 2 },
  divider: { height: 1, backgroundColor: Colors.outlineVariant, marginVertical: Spacing[5] },
  section: { gap: Spacing[3] },
  sectionTitle: { letterSpacing: -0.2 },
  description: { lineHeight: 22 },
  lockedHint: {
    backgroundColor: Colors.primaryFixed,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3], marginTop: Spacing[2],
    flexDirection: 'row', alignItems: 'center',
  },
  lockedHintText: {
    fontFamily: Typography.fontBody, fontSize: Typography.size.sm,
    color: Colors.primary,
  },
  agentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4], gap: Spacing[3],
  },
  agentAvatar: {
    width: 48, height: 48, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  agentAvatarImg: { width: '100%', height: '100%' },
  agentAvatarInitial: {
    fontFamily: Typography.fontHeadline, fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold, color: Colors.primary,
  },
  agentInfo: { flex: 1, gap: 2 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.successContainer,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
  },
  callBtnText: {
    fontFamily: Typography.fontBody, fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold, color: Colors.success,
  },
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingTop: Spacing[4],
    paddingHorizontal: Layout.screenPaddingH,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    ...Shadows.lg, shadowOffset: { width: 0, height: -4 },
  },
  lockedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing[3] },
  lockedBarInfo: { flex: 1, gap: 2 },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.xl,
    ...Shadows.primary,
  },
  unlockBtnText: {
    fontFamily: Typography.fontBody, fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold, color: Colors.white,
  },
  unlockedBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  unlockedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.successContainer,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
  },
  unlockedBadgeText: {
    fontFamily: Typography.fontBody, fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold, color: Colors.success,
  },
  ctaCallBtn: {
    flex: 1, flexDirection: 'row', gap: Spacing[2],
    backgroundColor: Colors.primary,
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.xl,
    alignItems: 'center', justifyContent: 'center', ...Shadows.primary,
  },
  ctaCallText: {
    fontFamily: Typography.fontBody, fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold, color: Colors.white,
  },
});
