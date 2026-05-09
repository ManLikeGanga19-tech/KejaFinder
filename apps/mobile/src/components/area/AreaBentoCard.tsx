import React from 'react';
import { View, ImageBackground, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { Text } from '../ui/Text';

// Stable Unsplash imagery per area slug (until real area photos are uploaded)
const AREA_IMAGE: Record<string, string> = {
  kilimani: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80',
  westlands: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80',
  lavington: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80',
  kileleshwa: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80',
  'south-b': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
};

interface Props {
  slug: string;
  name: string;
  badge?: string;          // e.g. "HOT SPOT"
  trend?: string;          // e.g. "+12% demand"
  size?: 'large' | 'small';
  style?: ViewStyle;
}

/**
 * Area bento card per wireframes — image background with overlay text,
 * optional HOT SPOT badge and trend indicator.
 */
export function AreaBentoCard({ slug, name, badge, trend, size = 'small', style }: Props) {
  const router = useRouter();
  const uri = AREA_IMAGE[slug] ?? AREA_IMAGE.kilimani;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={[styles.card, size === 'large' ? styles.large : styles.small, style]}
      onPress={() => router.push(`/area/${slug}` as any)}
    >
      <ImageBackground
        source={{ uri }}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <View style={styles.scrim} />
        <View style={styles.content}>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          <View style={styles.bottom}>
            <Text style={styles.name}>{name}</Text>
            {trend && (
              <View style={styles.trendRow}>
                <Ionicons name="trending-up" size={12} color={Colors.white} />
                <Text style={styles.trendText}>{trend}</Text>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    ...Shadows.md,
  },
  large: { height: 220 },
  small: { height: 140 },
  bg: { flex: 1, justifyContent: 'space-between' },
  bgImage: { borderRadius: BorderRadius.card },
  scrim: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  content: {
    flex: 1,
    padding: Spacing[4],
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: Typography.weight.extrabold,
    color: Colors.tertiaryContainer,
    letterSpacing: 1.5,
  },
  bottom: {
    gap: 4,
  },
  name: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  trendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  trendText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
  },
});
