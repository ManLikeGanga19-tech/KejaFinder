/**
 * Jest setup — runs after each test file's framework is loaded.
 * Adds RNTL matchers and silences noisy RN warnings.
 */

import '@testing-library/jest-native/extend-expect';

// Silence "useNativeDriver" warning
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mock = require('react-native-reanimated/mock');
  mock.default.call = () => {};
  return mock;
});

// Mock expo-font so useFonts resolves immediately
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: () => true,
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Mock AsyncStorage
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
