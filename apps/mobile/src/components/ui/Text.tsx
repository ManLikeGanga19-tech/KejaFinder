import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

type Variant =
  | 'displayLarge'
  | 'displayMedium'
  | 'headlineLarge'
  | 'headlineMedium'
  | 'headlineSmall'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelSmall'
  | 'price';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
}

export function Text({ variant = 'bodyMedium', color, style, ...props }: Props) {
  return (
    <RNText
      style={[styles[variant], color ? { color } : undefined, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  displayLarge: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['6xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.onBackground,
    lineHeight: Typography.size['6xl'] * 1.1,
    letterSpacing: -1.5,
  },
  displayMedium: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['5xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.onBackground,
    lineHeight: Typography.size['5xl'] * 1.1,
    letterSpacing: -1,
  },
  headlineLarge: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['4xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.onBackground,
    lineHeight: Typography.size['4xl'] * 1.15,
    letterSpacing: -0.5,
  },
  headlineMedium: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.onBackground,
    lineHeight: Typography.size['3xl'] * 1.2,
  },
  headlineSmall: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.onBackground,
    lineHeight: Typography.size['2xl'] * 1.2,
  },
  titleLarge: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.onSurface,
    lineHeight: Typography.size.xl * 1.3,
  },
  titleMedium: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.onSurface,
    lineHeight: Typography.size.lg * 1.4,
  },
  titleSmall: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.onSurface,
    lineHeight: Typography.size.md * 1.4,
  },
  bodyLarge: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    color: Colors.onSurface,
    lineHeight: Typography.size.md * 1.6,
  },
  bodyMedium: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.regular,
    color: Colors.onSurface,
    lineHeight: Typography.size.base * 1.6,
  },
  bodySmall: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.regular,
    color: Colors.onSurfaceVariant,
    lineHeight: Typography.size.sm * 1.5,
  },
  labelLarge: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    lineHeight: Typography.size.sm * 1,
  },
  labelSmall: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
    lineHeight: Typography.size.xs * 1,
  },
  price: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.extrabold,
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
});
