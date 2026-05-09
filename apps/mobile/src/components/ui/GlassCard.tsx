import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'low' | 'medium' | 'high';
}

/**
 * Glassmorphism card — layered translucent surface with soft tonal depth.
 *
 * Uses semi-transparent fills + subtle highlight + low-opacity ghost border
 * to imply "frosted" depth without pulling in expo-blur. On solid backgrounds
 * this gives a premium milky look. If we later place it over a photo or
 * gradient, swap the inner layer for `<BlurView>` from expo-blur.
 */
export function GlassCard({ children, style, intensity = 'medium' }: Props) {
  const tint =
    intensity === 'low' ? 'rgba(255,255,255,0.55)' :
    intensity === 'high' ? 'rgba(255,255,255,0.85)' :
    'rgba(255,255,255,0.72)';

  return (
    <View style={[styles.outer, style]}>
      {/* Soft tinted glow underlay */}
      <View style={styles.glow} pointerEvents="none" />
      {/* Frosted milky fill */}
      <View style={[styles.fill, { backgroundColor: tint }]}>
        {/* Subtle top highlight (catches light) */}
        <View style={styles.highlight} pointerEvents="none" />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLowest,
    shadowColor: '#1a1c1d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 35, 111, 0.06)',
  },
  glow: {
    position: 'absolute',
    top: -40, left: -40, right: -40, bottom: -40,
    backgroundColor: 'rgba(220, 225, 255, 0.35)',
    opacity: 0.5,
  },
  fill: {
    padding: Spacing[5],
  },
  highlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
