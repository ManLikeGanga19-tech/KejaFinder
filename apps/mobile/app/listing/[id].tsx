import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography, Layout } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Eyebrow } from '../../src/components/ui/Eyebrow';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { ImageViewer } from '../../src/components/listing/ImageViewer';
import { apiFetch } from '../../src/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Photo { id: string; url: string; isCover: boolean; }
interface AreaPreview {
  slug: string; name: string; safetyRating: number; safetyLabel: string;
  costTier: string; rentRangeMin: number; rentRangeMax: number; mobilityScore: number;
}
interface AgentPublic {
  id: string; displayName: string; companyName?: string;
  logoUrl?: string; phone?: string; email?: string;
}
interface Listing {
  id: string; slug: string; title: string;
  descriptionTeaser: string; descriptionFull?: string;
  propertyType: string; priceKes: number; pricePeriod: string;
  bedrooms: number; bathrooms: number; areaSqft?: number;
  furnishing: string; parking: number;
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
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }
  if (!listing) {
    return (
      <View style={styles.loader}>
        <Text variant="bodyMedium">Listing not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing[4] }}>
          <Text variant="labelLarge" color={Colors.primary}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isUnlocked = listing.isUnlockedByMe;
  const cover = listing.photos.find(p => p.isCover) ?? listing.photos[0];
  const thumbnails = listing.photos.filter(p => p.id !== cover?.id).slice(0, 2);
  const moreCount = Math.max(0, listing.photos.length - 1 - thumbnails.length);

  // Open the fullscreen image viewer at the right starting photo
  const openViewer = (photoId: string) => {
    const idx = listing.photos.findIndex(p => p.id === photoId);
    setViewerIndex(idx >= 0 ? idx : 0);
    setViewerOpen(true);
  };

  return (
    <View style={styles.root}>
      <AppHeader showBack onBack={() => router.back()} showMenu={false} trailing="none"
        rightSlot={
          <TouchableOpacity onPress={handleSave} style={styles.headerIconBtn}>
            <Ionicons
              name={listing.isSavedByMe ? 'heart' : 'heart-outline'}
              size={22}
              color={listing.isSavedByMe ? Colors.error : Colors.primary}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing[8] }]}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        overScrollMode="never"
      >
        {/* ── Status pill ── */}
        <View style={styles.statusRow}>
          {isUnlocked ? (
            <View style={[styles.statusPill, styles.statusUnlocked]}>
              <Ionicons name="lock-open" size={12} color={Colors.white} />
              <Text style={[styles.statusText, { color: Colors.white }]}>LISTING UNLOCKED</Text>
            </View>
          ) : listing.isVerified ? (
            <View style={[styles.statusPill, styles.statusVerified]}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.secondary} />
              <Text style={[styles.statusText, { color: Colors.secondary }]}>VERIFIED LISTING</Text>
            </View>
          ) : null}
        </View>

        {/* ── Hero photo (tap to open viewer) ── */}
        <TouchableOpacity
          activeOpacity={0.92}
          style={styles.heroWrap}
          onPress={() => cover && openViewer(cover.id)}
        >
          {cover ? (
            <Image source={{ uri: cover.url }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]} />
          )}
          {listing.photos.length > 0 && (
            <View style={styles.heroExpandBtn}>
              <Ionicons name="expand-outline" size={16} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>

        {/* ── Thumbnail strip (tap any to open at that index) ── */}
        {listing.photos.length > 1 && (
          <View style={styles.thumbStrip}>
            {thumbnails.map(p => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.85}
                style={styles.thumb}
                onPress={() => openViewer(p.id)}
              >
                <Image source={{ uri: p.url }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
            {moreCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.thumb, styles.moreThumb]}
                onPress={() => {
                  // Open viewer at the first photo not shown as a thumb
                  const next = listing.photos.find(p => !thumbnails.find(t => t.id === p.id) && p.id !== cover?.id);
                  if (next) openViewer(next.id);
                }}
              >
                <Ionicons name="images-outline" size={20} color={Colors.white} />
                <Text style={styles.moreThumbText}>+{moreCount} More{'\n'}Photos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Title + price ── */}
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, paddingRight: Spacing[3] }}>
              <Text variant="headlineLarge" style={styles.title} numberOfLines={3}>
                {listing.title}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.onSurfaceVariant} />
                <Text variant="bodyMedium" color={Colors.onSurfaceVariant} numberOfLines={1}>
                  {listing.area?.name ?? listing.city}{listing.address && isUnlocked ? `, ${listing.address}` : `, ${listing.city}`}
                </Text>
              </View>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.price}>KES{'\n'}{listing.priceKes.toLocaleString()}</Text>
              <Text style={styles.priceUnit}>PER MONTH</Text>
            </View>
          </View>

          {/* Inline stats row */}
          <View style={styles.statsInlineRow}>
            <Stat icon="bed-outline" value={`${listing.bedrooms} ${listing.bedrooms === 1 ? 'Bed' : 'Beds'}`} />
            <View style={styles.statDivider} />
            <Stat icon="water-outline" value={`${listing.bathrooms} Baths`} />
            {listing.areaSqft ? (
              <>
                <View style={styles.statDivider} />
                <Stat icon="resize-outline" value={`${listing.areaSqft.toLocaleString()} sqft`} />
              </>
            ) : null}
          </View>
        </View>

        {/* ── Area Intelligence Preview ── */}
        {listing.area && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
              <Text variant="titleMedium" style={{ color: Colors.primary }}>Area Intelligence Preview</Text>
            </View>

            <View style={styles.intelGrid}>
              {/* Safety Index */}
              <View style={styles.intelCard}>
                <View style={styles.intelHeader}>
                  <Text variant="labelSmall">Safety Index</Text>
                  <View style={styles.intelTagSafety}>
                    <Text style={[styles.intelTagText, { color: Colors.success }]}>HIGH SAFETY</Text>
                  </View>
                </View>
                <Text variant="bodySmall" color={Colors.onSurfaceVariant}>
                  Compared to Nairobi Average
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${listing.area.safetyRating}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text variant="labelSmall" color={Colors.onSurfaceVariant}>NATIONAL</Text>
                  <Text variant="labelSmall" color={Colors.success}>
                    {listing.area.safetyRating}%
                  </Text>
                </View>
              </View>

              {/* Cost of Living */}
              <View style={styles.intelCard}>
                <View style={styles.intelHeader}>
                  <Text variant="labelSmall">Cost of Living</Text>
                  <View style={styles.intelTagPremium}>
                    <Text style={[styles.intelTagText, { color: Colors.tertiaryContainer }]}>PREMIUM</Text>
                  </View>
                </View>
                <Text variant="bodySmall" color={Colors.onSurfaceVariant}>
                  Utility &amp; Service Estimates
                </Text>
                <View style={styles.intelStatRow}>
                  <Text style={styles.intelStatValue}>
                    {listing.area.costTier ?? '$$$'}
                  </Text>
                  {!isUnlocked && (
                    <View style={styles.lockedTag}>
                      <Ionicons name="lock-closed" size={10} color={Colors.onSurfaceVariant} />
                      <Text style={styles.lockedTagText}>LOCKED</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── About this Property (glass card) ── */}
        <View style={styles.section}>
          <GlassCard style={styles.aboutCard}>
            <View style={styles.aboutHeader}>
              <View style={styles.aboutIconCircle}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
              </View>
              <Text variant="titleMedium" style={styles.aboutTitle}>About this Property</Text>
            </View>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant} style={styles.descText}>
              {isUnlocked ? (listing.descriptionFull ?? listing.descriptionTeaser) : listing.descriptionTeaser}
            </Text>
          </GlassCard>
        </View>

        {/* ── Locked banner OR Unlocked details ── */}
        {!isUnlocked ? (
          <LockedBanner
            unlockPriceKes={listing.unlockPriceKes}
            onUnlock={() => router.push(`/payment/${id}` as any)}
          />
        ) : (
          <UnlockedSection listing={listing} />
        )}
      </ScrollView>

      <ImageViewer
        photos={listing.photos}
        initialIndex={viewerIndex}
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}

// ── Components ────────────────────────────────────────────────────────────

function Stat({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={16} color={Colors.primary} />
      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function LockedBanner({ unlockPriceKes, onUnlock }: { unlockPriceKes: number; onUnlock: () => void }) {
  const benefits: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
    { icon: 'person-outline', text: 'Full Agent Contact & Direct Chat' },
    { icon: 'shield-checkmark-outline', text: 'Verified Caretaker & Visit Report' },
    { icon: 'location-outline', text: 'Exact Pin Location & Street View' },
    { icon: 'analytics-outline', text: 'Historical Rent Trends (5 Years)' },
  ];

  return (
    <View style={styles.lockedBanner}>
      <View style={styles.lockedHeader}>
        <View style={styles.lockedIconCircle}>
          <Ionicons name="lock-closed" size={18} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={{ color: Colors.white }}>Property Details Locked</Text>
          <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Unlock the full report to take the next step.
          </Text>
        </View>
      </View>

      <View style={styles.benefitList}>
        {benefits.map(b => (
          <View key={b.text} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.primaryFixed} />
            <Text variant="bodyMedium" style={{ color: Colors.white, flex: 1 }}>{b.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.unlockBtn} activeOpacity={0.85} onPress={onUnlock}>
        <Ionicons name="lock-open" size={16} color={Colors.primary} />
        <Text style={styles.unlockBtnText}>Unlock Details (KES {unlockPriceKes} via M-Pesa)</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function UnlockedSection({ listing }: { listing: Listing }) {
  return (
    <>
      {/* Caretaker card */}
      {listing.caretakerName && (
        <View style={[styles.section, styles.unlockedCard]}>
          <Eyebrow color={Colors.success}>VERIFIED CARETAKER</Eyebrow>
          <Text variant="titleLarge" style={{ marginTop: 4 }}>{listing.caretakerName}</Text>

          {listing.caretakerPhone && (
            <View style={styles.unlockedRow}>
              <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>Contact Number</Text>
              <Text variant="titleSmall">{listing.caretakerPhone}</Text>
            </View>
          )}
          <View style={styles.unlockedRow}>
            <Text variant="bodyMedium" color={Colors.onSurfaceVariant}>Monthly Rent</Text>
            <Text variant="titleSmall">KES {listing.priceKes.toLocaleString()}</Text>
          </View>

          {listing.caretakerPhone && (
            <TouchableOpacity
              style={styles.callCaretakerBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(`tel:${listing.caretakerPhone}`)}
            >
              <Ionicons name="call" size={16} color={Colors.white} />
              <Text style={styles.callCaretakerText}>Call Caretaker</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Safety warning */}
      <View style={styles.safetyWarning}>
        <Ionicons name="warning-outline" size={20} color={Colors.tertiaryContainer} />
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={{ color: Colors.white }}>Safety First</Text>
          <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            Always visit the property in person before paying rent or deposits. We never recommend remote payments.
          </Text>
        </View>
      </View>

      {/* Detail rows */}
      <View style={styles.section}>
        <DetailRow icon="bed-outline" label="BEDROOMS" value={`${listing.bedrooms} ${listing.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}`} />
        <DetailRow icon="water-outline" label="BATHROOMS" value={`${listing.bathrooms} Baths`} />
        {listing.areaSqft ? <DetailRow icon="resize-outline" label="SIZE" value={`${listing.areaSqft.toLocaleString()} sqft`} /> : null}
        {listing.parking > 0 ? <DetailRow icon="car-outline" label="PARKING" value={`${listing.parking} ${listing.parking === 1 ? 'Bay' : 'Bays'}`} /> : null}
        {listing.amenities.length > 0 ? (
          <DetailRow icon="checkmark-done-outline" label="INCLUDED" value={listing.amenities.slice(0, 3).join(', ')} />
        ) : null}
      </View>
    </>
  );
}

function DetailRow({ icon, label, value }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="labelSmall" color={Colors.onSurfaceVariant}>{label}</Text>
        <Text variant="bodyLarge" style={{ marginTop: 2, fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { gap: Spacing[5] },

  headerIconBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },

  // Status pill
  statusRow: {
    paddingHorizontal: Layout.screenPaddingH,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusVerified: { backgroundColor: Colors.secondaryFixed },
  statusUnlocked: { backgroundColor: Colors.success },
  statusText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1.2,
  },

  // Hero
  heroWrap: {
    marginHorizontal: Layout.screenPaddingH,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },
  heroImage: {
    width: '100%',
    height: 260,
  },
  heroPlaceholder: { backgroundColor: Colors.surfaceContainerHigh },
  heroExpandBtn: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Thumbnails
  thumbStrip: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPaddingH,
    gap: Spacing[3],
  },
  thumb: {
    flex: 1,
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  moreThumb: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  moreThumbText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Title + price
  titleBlock: {
    paddingHorizontal: Layout.screenPaddingH,
    gap: Spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.primary,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing[1],
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
    letterSpacing: -0.5,
    textAlign: 'right',
    lineHeight: 28,
  },
  priceUnit: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginTop: 2,
  },

  // Stats inline
  statsInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginTop: Spacing[2],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.outlineVariant,
  },

  // Sections
  section: {
    paddingHorizontal: Layout.screenPaddingH,
    gap: Spacing[3],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Area intelligence cards
  intelGrid: {
    gap: Spacing[3],
  },
  intelCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[2],
    ...Shadows.sm,
  },
  intelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intelTagSafety: {
    backgroundColor: Colors.successContainer,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  intelTagPremium: {
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  intelTagText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: Typography.weight.extrabold,
    letterSpacing: 1.2,
  },
  intelStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[1],
  },
  intelStatValue: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.tertiaryContainer,
    letterSpacing: -0.5,
  },
  lockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  lockedTagText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },

  // Progress bar
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerHigh,
    overflow: 'hidden',
    marginTop: Spacing[1],
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },

  // About (glass card)
  aboutCard: {
    marginHorizontal: 0,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  aboutIconCircle: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  aboutTitle: {
    color: Colors.primary,
  },
  descText: {
    lineHeight: 22,
  },

  // Locked banner
  lockedBanner: {
    marginHorizontal: Layout.screenPaddingH,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    gap: Spacing[4],
    ...Shadows.primary,
  },
  lockedHeader: {
    flexDirection: 'row',
    gap: Spacing[3],
    alignItems: 'flex-start',
  },
  lockedIconCircle: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  benefitList: {
    gap: Spacing[3],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.full,
    marginTop: Spacing[2],
  },
  unlockBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },

  // Unlocked
  unlockedCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    marginHorizontal: Layout.screenPaddingH,
    ...Shadows.sm,
  },
  unlockedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
  },
  callCaretakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.success,
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.full,
    marginTop: Spacing[3],
    ...Shadows.md,
  },
  callCaretakerText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },
  safetyWarning: {
    marginHorizontal: Layout.screenPaddingH,
    flexDirection: 'row',
    gap: Spacing[3],
    backgroundColor: Colors.tertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  detailIcon: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
});
