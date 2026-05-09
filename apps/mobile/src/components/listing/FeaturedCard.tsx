import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { Text } from '../ui/Text';

interface Props {
  id: string;
  title: string;
  priceKes: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft?: number;
  city: string;
  area?: { name: string; slug: string };
  isFeatured?: boolean;
  isSavedByMe?: boolean;
  photos?: { url: string; isCover: boolean }[];
}

const CARD_WIDTH = 280;

/** Featured listing card per wireframe — single large image with FEATURED tag + heart overlay. */
export function FeaturedCard({
  id, title, priceKes, bedrooms, bathrooms, areaSqft, city, area,
  isFeatured = true, isSavedByMe, photos = [],
}: Props) {
  const router = useRouter();
  const cover = photos.find(p => p.isCover) ?? photos[0];

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.card}
      onPress={() => router.push(`/listing/${id}` as any)}
    >
      <View style={styles.imageWrap}>
        {cover ? (
          <Image source={{ uri: cover.url }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        {isFeatured && (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        )}
        <TouchableOpacity style={styles.heartBtn}>
          <Ionicons
            name={isSavedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={isSavedByMe ? Colors.error : Colors.white}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text variant="titleSmall" numberOfLines={1}>{title}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={Colors.onSurfaceVariant} />
          <Text variant="bodySmall" color={Colors.onSurfaceVariant} numberOfLines={1}>
            {area?.name ?? city}
          </Text>
        </View>

        <Text style={styles.price}>
          KSh {priceKes.toLocaleString()} <Text style={styles.priceUnit}>/ mo</Text>
        </Text>

        <View style={styles.statsRow}>
          <Stat icon="bed-outline" value={`${bedrooms} Beds`} />
          <Stat icon="water-outline" value={`${bathrooms} Baths`} />
          {areaSqft ? <Stat icon="resize-outline" value={`${areaSqft.toLocaleString()} sqft`} /> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Stat({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={12} color={Colors.onSurfaceVariant} />
      <Text variant="labelSmall" style={styles.statText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    ...Shadows.md,
  },
  imageWrap: {
    height: 180,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: Colors.surfaceContainerHigh },
  featuredTag: {
    position: 'absolute', top: Spacing[3], left: Spacing[3],
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[3], paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  featuredText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: Typography.weight.extrabold,
    color: Colors.white,
    letterSpacing: 1.5,
  },
  heartBtn: {
    position: 'absolute', top: Spacing[3], right: Spacing[3],
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  body: {
    padding: Spacing[4],
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  price: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  priceUnit: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.regular,
    color: Colors.onSurfaceVariant,
  },
  statsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3],
    marginTop: Spacing[2],
  },
  stat: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  statText: {
    color: Colors.onSurfaceVariant,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
