import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, QuantityStepper } from '@/components/ui';
import { useServerCart, useSetServerCartQuantity } from '@/features/cart/cart-store';
import { useGuestCart } from '@/features/cart/guest-cart-store';
import { useSession } from '@/features/auth/session-store';
import { useRouter } from 'expo-router';
import { formatRupees } from '@/lib/format';
import { resolveProductImageUrl } from '@/api/products';
import { colors, gutter, radius, spacing } from '@/theme';

export default function CartRoute() {
  const { data: cart, isLoading, error, refetch } = useServerCart();
  const setQuantity = useSetServerCartQuantity();
  const signedIn = useSession((state) => state.status === 'signedIn'); const guest = useGuestCart((state) => state.lines); const router = useRouter();
  const items = signedIn ? cart?.items ?? [] : Object.values(guest).map((line) => ({ id: `guest-${line.product.id}`, quantity: line.quantity, product: line.product, lineTotal: line.product.price * line.quantity }));
  const subtotal = signedIn ? cart?.subtotal ?? 0 : items.reduce((total, item) => total + item.lineTotal, 0);
  if (signedIn && isLoading) return <SafeAreaView style={styles.screen}><AppText>Loading cart…</AppText></SafeAreaView>;
  if (error) return <SafeAreaView style={styles.screen}><AppText variant="bodyStrong">Unable to load your cart.</AppText><Pressable onPress={() => void refetch()}><AppText color="primaryText">Retry</AppText></Pressable></SafeAreaView>;
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}><AppText variant="screenTitle">Cart</AppText>{items.length ? items.map((item) => <View key={item.id} style={styles.card}>{resolveProductImageUrl(item.product.imageUrl) ? <Image source={{ uri: resolveProductImageUrl(item.product.imageUrl)! }} style={styles.image} /> : null}<View style={styles.copy}><AppText variant="title">{item.product.name}</AppText><AppText color="textMuted">{formatRupees(item.product.price)} each</AppText><AppText variant="bodyStrong">{formatRupees(item.lineTotal)}</AppText></View><QuantityStepper quantity={item.quantity} unit="unit" productName={item.product.name} onDecrement={() => setQuantity.mutate({ productId: item.product.id, quantity: item.quantity - 1, product: item.product })} onIncrement={() => setQuantity.mutate({ productId: item.product.id, quantity: item.quantity + 1, product: item.product })} /></View>) : <AppText color="textMuted">Your cart is empty.</AppText>}{items.length ? <><View style={styles.total}><AppText variant="title">Subtotal</AppText><AppText variant="priceLg">{formatRupees(subtotal)}</AppText></View><Pressable style={styles.order} onPress={() => router.push(signedIn ? '/checkout' : '/sign-in?checkout=1')}><AppText variant="bodyStrong" color="textOnPrimary">Order Now</AppText></Pressable></> : null}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter }, content: { paddingVertical: spacing.xl, gap: spacing.lg }, card: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }, image: { width: 52, height: 52, borderRadius: radius.md }, copy: { flex: 1, gap: spacing.xs }, total: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.lg }, order: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary } });
