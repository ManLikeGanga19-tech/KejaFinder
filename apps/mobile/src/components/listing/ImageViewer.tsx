import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Text } from '../ui/Text';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Photo { id: string; url: string; }

interface Props {
  photos: Photo[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

/**
 * Fullscreen image viewer with smooth horizontal swipe paging.
 *
 * Performance notes:
 *   - FlatList with pagingEnabled snaps to each photo
 *   - decelerationRate="fast" makes the snap feel snappy, not slow
 *   - getItemLayout pre-computes positions so initialScrollIndex doesn't measure
 *   - removeClippedSubviews keeps memory low when many photos
 *   - viewabilityConfig fires onViewableItemsChanged at >50% visible (deduped)
 */
export function ImageViewer({ photos, initialIndex = 0, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Photo>>(null);
  const [index, setIndex] = useState(initialIndex);

  // When opened, jump to the requested photo without animation
  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      // Defer to next tick so the FlatList is mounted
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      });
    }
  }, [visible, initialIndex]);

  const onViewableChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000"
        translucent={Platform.OS === 'android'}
      />
      <View style={styles.root}>
        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={p => p.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
          onViewableItemsChanged={onViewableChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews
          windowSize={3}
          maxToRenderPerBatch={2}
          renderItem={({ item }) => (
            <View style={styles.page}>
              <Image source={{ uri: item.url }} style={styles.image} resizeMode="contain" />
            </View>
          )}
        />

        {/* Top bar — counter + close */}
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing[2] }]}>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {index + 1} / {photos.length}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Ionicons name="close" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Bottom dot indicator */}
        {photos.length > 1 && photos.length <= 10 && (
          <View style={[styles.dotsRow, { bottom: insets.bottom + Spacing[5] }]}>
            {photos.map((p, i) => (
              <View
                key={p.id}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },

  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[3],
  },
  counter: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  counterText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    letterSpacing: 1,
  },
  closeBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dotsRow: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.white,
  },
});
