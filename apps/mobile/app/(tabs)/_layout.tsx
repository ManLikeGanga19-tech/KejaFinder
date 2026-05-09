import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: '🏠', inactive: '🏠' },
  explore: { active: '🗺️', inactive: '🗺️' },
  saved: { active: '❤️', inactive: '🤍' },
  notifications: { active: '🔔', inactive: '🔔' },
  profile: { active: '👤', inactive: '👤' },
};

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          { paddingBottom: insets.bottom + Spacing[2] },
        ],
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name] ?? { active: '●', inactive: '○' };
          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Text style={{ fontSize: 20 }}>
                {focused ? icons.active : icons.inactive}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 0,
    borderTopLeftRadius: BorderRadius.bottomTab,
    borderTopRightRadius: BorderRadius.bottomTab,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacing[2],
    paddingHorizontal: Spacing[4],
    height: 80,
    ...Shadows.lg,
    shadowOffset: { width: 0, height: -8 },
  },
  tabLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  iconContainer: {
    width: 44,
    height: 32,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: Colors.primaryFixed,
  },
});
