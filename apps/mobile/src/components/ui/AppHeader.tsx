import React from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';
import { Text } from './Text';

interface Props {
  showMenu?: boolean;
  onMenu?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  trailing?: 'avatar' | 'none';
  trailingLabel?: string;
}

/**
 * AppHeader — used on every primary screen.
 *
 * Layout per wireframes: hamburger/back on left, KejaFinder wordmark
 * (or score chip), avatar circle on right.
 */
export function AppHeader({
  showMenu = true,
  onMenu,
  showBack,
  onBack,
  rightSlot,
  trailing = 'avatar',
  trailingLabel,
}: Props) {
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
        ) : showMenu ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onMenu}>
            <Ionicons name="menu" size={22} color={Colors.primary} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.brand}>KejaFinder</Text>
      </View>

      <View style={styles.right}>
        {rightSlot}
        {trailing === 'avatar' && (
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {(trailingLabel ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[3],
    backgroundColor: Colors.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Typography.fontHeadline,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
});
