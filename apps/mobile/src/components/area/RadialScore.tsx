import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
import { Text } from '../ui/Text';

interface Props {
  value: number;        // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}

/**
 * Radial progress indicator using stacked rings (no SVG dep needed).
 *
 * The trick: 4 quarter-arcs constructed from rotated/clipped circles so we
 * can express any 0–100 value without pulling in react-native-svg. For a
 * production-grade version with smooth ring tweening, swap in SVG later.
 */
export function RadialScore({
  value,
  size = 120,
  strokeWidth = 10,
  color = Colors.success,
  trackColor = Colors.surfaceContainerHigh,
  label,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  // Each "tick" is 5% — render 20 ticks around the ring, color the first N
  const ticks = 20;
  const filled = Math.round((clamped / 100) * ticks);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* Tick ring */}
      {Array.from({ length: ticks }).map((_, i) => {
        const angle = (i / ticks) * 360 - 90; // start at 12 o'clock
        const isFilled = i < filled;
        return (
          <View
            key={i}
            style={[
              styles.tick,
              {
                width: strokeWidth / 2,
                height: size / 2,
                left: size / 2 - strokeWidth / 4,
                top: 0,
                backgroundColor: 'transparent',
                transform: [
                  { translateY: 0 },
                  { rotate: `${angle + 90}deg` },
                  { translateY: -size / 2 + strokeWidth / 2 },
                ],
                transformOrigin: 'top',
              },
            ]}
          >
            <View
              style={{
                width: strokeWidth / 2,
                height: strokeWidth,
                borderRadius: strokeWidth / 2,
                backgroundColor: isFilled ? color : trackColor,
              }}
            />
          </View>
        );
      })}

      {/* Center value */}
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={[styles.value, { color }]}>{clamped}</Text>
        {label && <Text style={[styles.label, { color }]}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    position: 'absolute',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: Typography.fontHeadline,
    fontSize: 36,
    fontWeight: Typography.weight.extrabold,
    letterSpacing: -1.5,
    lineHeight: 38,
  },
  label: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
