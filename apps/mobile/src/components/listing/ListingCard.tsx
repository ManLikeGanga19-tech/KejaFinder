import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { Text } from '../ui/Text';
import { Badge } from '../ui/Badge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing[6] * 2;

interface ListingCardProps {
  id: string;
  slug: string;
  title: string;
  priceKes: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  city: string;
  area?: { name: string; slug: string };
  isLocked?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  isSavedByMe?: boolean;
  unlockPriceKes?: number;
  photos?: { url: string; isCover: boolean }[];
  viewCount?: number;
}

export function ListingCard({
  id,
  title,
  priceKes,
  bedrooms,
  bathrooms,
  propertyType,
  city,
  area,
  isLocked = true,
  isVerified = false,
  isFeatured = false,
  unlockPriceKes = 499,
  photos = [],
}: ListingCardProps) {
  const router = useRouter();
  const coverPhoto = photos.find(p => p.isCover) ?? photos[0];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => router.push(`/listing/${id}` as any)}
    >
      <View style={styles.imageContainer}>
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto.url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        <View style={styles.badgeRow}>
          {isFeatured && <Badge label="Featured" variant="featured" />}
          {isVerified && <Badge label="Verified" variant="verified" />}
          {isLocked && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={14} color={Colors.onSurface} />
            </View>
          )}
        </View>

        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{formatType(propertyType)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text variant="titleSmall" style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <Text variant="bodySmall" style={styles.location} numberOfLines={1}>
          {area?.name ?? city}
        </Text>

        <View style={styles.statsRow}>
          <StatPill iconName="bed-outline" value={`${bedrooms} bd`} />
          <StatPill iconName="water-outline" value={`${bathrooms} ba`} />
          <StatPill iconName="home-outline" value={formatType(propertyType)} />
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text variant="labelSmall">per month</Text>
            <Text variant="price">KES {priceKes.toLocaleString()}</Text>
          </View>
          {isLocked && (
            <View style={styles.unlockChip}>
              <Text style={styles.unlockText}>Unlock KES {unlockPriceKes}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatPill({ iconName, value }: { iconName: React.ComponentProps<typeof Ionicons>['name']; value: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={iconName} size={13} color={Colors.onSurfaceVariant} />
      <Text variant="labelSmall" style={styles.statText}>{value}</Text>
    </View>
  );
}

function formatType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    marginBottom: Spacing[4],
    ...Shadows.md,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  badgeRow: {
    position: 'absolute',
    top: Spacing[3],
    left: Spacing[3],
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
  },
  lockBadge: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  lockIcon: {
    fontSize: 14,
  },
  typeBadge: {
    position: 'absolute',
    bottom: Spacing[3],
    left: Spacing[3],
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    padding: Spacing[4],
    gap: Spacing[2],
  },
  title: {
    letterSpacing: -0.2,
  },
  location: {
    color: Colors.onSurfaceVariant,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statIcon: {
    fontSize: 12,
  },
  statText: {
    color: Colors.onSurfaceVariant,
    textTransform: 'none',
    letterSpacing: 0,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing[1],
  },
  unlockChip: {
    backgroundColor: Colors.primaryFixed,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
  },
  unlockText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
});
