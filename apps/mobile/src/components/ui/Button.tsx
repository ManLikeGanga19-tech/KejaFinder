import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'mpesa';
type Size = 'sm' | 'md' | 'lg';

interface Props extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'lg',
  label,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  disabled,
  ...props
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.label,
              styles[`label_${size}`],
              variant === 'outline' && { color: Colors.primary },
              variant === 'ghost' && { color: Colors.primary },
              variant === 'secondary' && { color: Colors.primary },
              variant === 'mpesa' && { color: Colors.white },
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing[2],
  },
  iconRight: {
    marginLeft: Spacing[2],
  },
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.primary,
  },
  secondary: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  mpesa: {
    backgroundColor: Colors.mpesa,
    ...Shadows.md,
  },
  size_sm: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  size_md: {
    paddingHorizontal: Spacing[6],
    paddingVertical: 12,
  },
  size_lg: {
    paddingHorizontal: Spacing[6],
    paddingVertical: 16,
  },
  label: {
    color: Colors.white,
    fontFamily: Typography.fontBody,
    fontWeight: Typography.weight.bold,
  },
  label_sm: {
    fontSize: Typography.size.sm,
  },
  label_md: {
    fontSize: Typography.size.base,
  },
  label_lg: {
    fontSize: Typography.size.md,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
