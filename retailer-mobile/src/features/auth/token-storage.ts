import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'sarakusetu.accessToken';

/** Access token persisted in the platform keystore via expo-secure-store. */
export const tokenStorage = {
  get: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
};
