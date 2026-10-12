import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, StatusBadge } from '@/components/ui';
import { useOrders } from '@/features/orders/orders';
import { getOrderStatusPresentation, getOrderStatusTone } from '@/features/orders/status';
import { formatRupees } from '@/lib/format';
import { colors, gutter, radius, spacing } from '@/theme';

export default function OrdersRoute() {
  const router = useRouter(); const { data: orders, isLoading, error, refetch, isRefetching } = useOrders();
  if (isLoading) return <SafeAreaView style={styles.screen}><AppText>Loading orders…</AppText></SafeAreaView>;
  if (error) return <SafeAreaView style={styles.screen}><AppText variant="bodyStrong">Unable to load orders.</AppText><Pressable onPress={() => void refetch()}><AppText color="primaryText">Retry</AppText></Pressable></SafeAreaView>;
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}><AppText variant="screenTitle">Orders</AppText>{orders?.length ? orders.map((order) => <Pressable key={order.id} onPress={() => router.push(`/order/${order.id}`)} style={styles.card}><View style={styles.row}><AppText variant="title">Order #{order.id}</AppText><StatusBadge label={getOrderStatusPresentation(order.status).label} tone={getOrderStatusTone(order.status)} /></View><AppText color="textMuted">{new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.items.reduce((total, item) => total + item.quantity, 0)} items</AppText><AppText variant="priceLg">{formatRupees(order.subtotal)}</AppText></Pressable>) : <View style={styles.empty}><AppText color="textMuted">No orders yet.</AppText><Pressable onPress={() => router.replace('/')}><AppText color="primaryText">Start shopping</AppText></Pressable></View>}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: gutter }, content: { paddingVertical: spacing.xl, gap: spacing.lg }, card: { padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, empty: { gap: spacing.sm } });
