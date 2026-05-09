import Constants from 'expo-constants';

// Android emulator: 10.0.2.2 reaches the host machine's localhost
// Real device: needs your machine's LAN IP — Expo provides it via hostUri
const DEV_HOST = Constants.expoConfig?.hostUri?.split(':')[0] ?? '10.0.2.2';

export const API_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:3001/v1`
  : 'https://api.kejafinder.co.ke/v1';
