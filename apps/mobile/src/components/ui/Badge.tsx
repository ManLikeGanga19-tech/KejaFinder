import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'surface' | 'verified' | 'featured' | 'locked';

interface Props {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'surface', style }: Props) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, textColors[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  primary: { backgroundColor: Colors.primaryFixed },
  secondary: { backgroundColor: Colors.secondaryFixed },
  success: { backgroundColor: Colors.successContainer },
  warning: { backgroundColor: Colors.warningContainer },
  error: { backgroundColor: Colors.errorContainer },
  surface: { backgroundColor: Colors.surfaceContainerHigh },
  verified: { backgroundColor: Colors.secondaryFixed },
  featured: { backgroundColor: Colors.tertiaryFixed },
  locked: { backgroundColor: 'rgba(0,0,0,0.55)' },
});

const textColors: Record<Variant, object> = {
  primary: { color: Colors.primary },
  secondary: { color: Colors.onSecondaryContainer },
  success: { color: Colors.success },
  warning: { color: Colors.warning },
  error: { color: Colors.onErrorContainer },
  surface: { color: Colors.onSurfaceVariant },
  verified: { color: Colors.onSecondaryContainer },
  featured: { color: Colors.tertiaryContainer },
  locked: { color: Colors.white },
};
