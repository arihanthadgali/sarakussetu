import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addCartItem } from '@/api/cart';
import { createOrder } from '@/api/orders';
import { CheckoutUncertainError, createCheckoutAttempt } from '@/features/checkout/checkout-attempt';
import { useSession } from '@/features/auth/session-store';
import { AppText } from '@/components/ui';
import { cartQueryKey } from '@/features/cart/cart-store';
import { useGuestCart } from '@/features/cart/guest-cart-store';
import { ordersQueryKey } from '@/features/orders/orders';
import { colors, gutter, radius, spacing } from '@/theme';

export default function CheckoutRoute() {
  const client = useQueryClient();
  const signedIn = useSession((state) => state.status === 'signedIn');
  const attempt = useRef<ReturnType<typeof createCheckoutAttempt> | null>(null);
  const started = useRef(false);
  const checkout = useMutation({
    retry: false,
    mutationFn: () => {
      if (!attempt.current) {
        const guest = useGuestCart.getState();
        attempt.current = createCheckoutAttempt(Object.values(guest.lines), {
          addItem: addCartItem, order: createOrder, clearGuest: guest.clear,
        });
      }
      return attempt.current.run();
    },
    onSuccess: (order) => {
      void client.invalidateQueries({ queryKey: cartQueryKey });
      void client.invalidateQueries({ queryKey: ordersQueryKey });
      router.replace({ pathname: '/payment', params: { id: order.id, total: String(order.subtotal), status: order.status } });
    },
  });
  useEffect(() => {
    if (signedIn && !started.current) {
      started.current = true;
      checkout.mutate();
    }
  }, [signedIn, checkout]);
  const uncertain = checkout.error instanceof CheckoutUncertainError;
  return <SafeAreaView style={styles.screen}><View style={styles.card}>{checkout.isPending ? <AppText>Creating your order…</AppText> : checkout.isError ? <><AppText variant="bodyStrong">{uncertain ? checkout.error?.message : 'Unable to create your order.'}</AppText>{uncertain ? <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/orders')}><AppText color="textOnPrimary">View orders</AppText></Pressable> : <Pressable style={styles.button} onPress={() => checkout.mutate()}><AppText color="textOnPrimary">Try again</AppText></Pressable>}</> : null}</View></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', backgroundColor: colors.canvas, padding: gutter }, card: { gap: spacing.lg, padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.surface }, button: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary } });
