import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Shadows, Spacing } from '../../src/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Tab order + labels from wireframes
const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'compass', inactive: 'compass-outline' },           // EXPLORE
  explore: { active: 'analytics', inactive: 'analytics-outline' },     // INSIGHTS (was: explore)
  saved: { active: 'heart', inactive: 'heart-outline' },               // SAVED
  notifications: { active: 'notifications', inactive: 'notifications-outline' }, // ALERTS
  profile: { active: 'grid', inactive: 'grid-outline' },               // MENU (was: profile)
};

const TAB_BAR_HEIGHT = 60;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_HEIGHT + bottomPadding,
            paddingBottom: bottomPadding,
          },
        ],
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
          const name = focused ? icons.active : icons.inactive;
          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={name} size={size ?? 22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Explore' }} />
      <Tabs.Screen name="explore" options={{ title: 'Insights' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Menu' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 0,
    paddingTop: Spacing[2],
    paddingHorizontal: Spacing[2],
    ...Shadows.lg,
    shadowOffset: { width: 0, height: -4 },
  },
  tabLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1,
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
