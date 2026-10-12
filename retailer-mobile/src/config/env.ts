import { Platform } from 'react-native';

/**
 * Runtime configuration. Only EXPO_PUBLIC_* variables are available in the
 * bundle, and they must be read with the literal `process.env.NAME` form so
 * Expo can inline them.
 */
const DEFAULT_API_BASE_URL = Platform.select({
  // The Android emulator reaches the host machine through 10.0.2.2.
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

export function resolveApiBaseUrl(value: string | undefined): string {
  const url = value?.trim() || DEFAULT_API_BASE_URL;
  return url.replace(/\/+$/, '');
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
  requestTimeoutMs: 15_000,
} as const;
