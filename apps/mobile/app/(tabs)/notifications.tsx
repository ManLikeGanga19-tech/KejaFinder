import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Colors, Spacing, BorderRadius, Layout, Shadows } from '../../src/constants/theme';
import { Text } from '../../src/components/ui/Text';
import { apiFetch } from '../../src/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ notifications: Notification[] }>('/notifications', { auth: true })
      .then(d => setNotifications(d.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await apiFetch(`/notifications/${id}/read`, { method: 'PATCH', auth: true }).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing[8] }} />
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="titleMedium">No notifications yet</Text>
          </View>
        ) : (
          notifications.map(n => (
            <TouchableOpacity
              key={n.id}
              style={[styles.notif, !n.readAt && styles.notifUnread]}
              onPress={() => markRead(n.id)}
              activeOpacity={0.85}
            >
              {!n.readAt && <View style={styles.unreadDot} />}
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall">{n.title}</Text>
                <Text variant="bodySmall" color={Colors.onSurfaceVariant} style={{ marginTop: 2 }}>
                  {n.body}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[5],
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[8],
    gap: Spacing[3],
  },
  empty: { alignItems: 'center', paddingVertical: Spacing[12] },
  notif: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadows.sm,
  },
  notifUnread: { backgroundColor: Colors.primaryFixed },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
});
