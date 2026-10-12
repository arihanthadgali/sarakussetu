import {
  FjallaOne_400Regular,
} from '@expo-google-fonts/fjalla-one';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/session-store';
import { useGuestCart } from '@/features/cart/guest-cart-store';
import { AppProviders } from '@/providers/AppProviders';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/**
 * Startup: load fonts and, in parallel, restore the session
 * (stored token -> GET /api/auth/me). The splash stays up until both finish.
 * Stack.Protected then shows exactly one route group for the session state.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    FjallaOne_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const status = useSession((state) => state.status);
  const bootstrap = useSession((state) => state.bootstrap);
  const guestCartHydrated = useGuestCart((state) => state.hydrated);
  const hydrateGuestCart = useGuestCart((state) => state.hydrate);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    void hydrateGuestCart();
  }, [hydrateGuestCart]);

  const ready = (fontsLoaded || fontError !== null) && status !== 'booting' && guestCartHydrated;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="payment" />
        <Stack.Protected guard={status === 'unreachable'}>
          <Stack.Screen name="connection" />
        </Stack.Protected>
      </Stack>
    </AppProviders>
  );
}
