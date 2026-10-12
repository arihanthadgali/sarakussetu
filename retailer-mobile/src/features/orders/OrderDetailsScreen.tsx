import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, StatusBadge } from '@/components/ui';
import type { RetailerOrder } from '@/api/orders';
import { formatRupees } from '@/lib/format';
import { colors, gutter, radius, spacing } from '@/theme';

import { OrderStatusTimeline } from './OrderStatusTimeline';
import { getOrderStatusPresentation, getOrderStatusTone } from './status';

type OrderDetailsScreenProps = {
  order?: RetailerOrder;
  isLoading: boolean;
  error: unknown;
  isRefreshing: boolean;
  onRetry: () => void;
  onRefresh: () => void;
  onBack: () => void;
};

export function OrderDetailsScreen({ order, isLoading, error, isRefreshing, onRetry, onRefresh, onBack }: OrderDetailsScreenProps) {
  if (isLoading) return <View style={styles.state}><AppText>Loading order…</AppText></View>;
  if (error) return <View style={styles.state}><AppText variant="bodyStrong">Unable to load this order.</AppText><Pressable onPress={onRetry}><AppText color="primaryText">Retry</AppText></Pressable></View>;
  if (!order) return <View style={styles.state}><AppText variant="bodyStrong">Order not found.</AppText><Pressable onPress={onBack}><AppText color="primaryText">Back to orders</AppText></Pressable></View>;

  const presentation = getOrderStatusPresentation(order.status);
  return <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
    <View style={styles.topRow}><Pressable onPress={onBack}><AppText color="primaryText">← Back to orders</AppText></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Refresh order" onPress={onRefresh}><AppText color="primaryText">Refresh</AppText></Pressable></View>
    <View style={styles.card}>
      <View style={styles.headerRow}><AppText variant="screenTitle">Order #{order.id}</AppText><StatusBadge label={presentation.label} tone={getOrderStatusTone(order.status)} /></View>
      <AppText color="textMuted">{new Date(order.createdAt).toLocaleString('en-IN')}</AppText>
    </View>
    <View style={styles.card}><AppText variant="sectionTitle">Order status</AppText><OrderStatusTimeline status={order.status} /></View>
    <View style={styles.card}><AppText variant="sectionTitle">Items</AppText>{order.items.map((item) => <View key={item.id} style={styles.item}><View style={styles.itemCopy}><AppText variant="title">{item.productName}</AppText><AppText color="textMuted">{item.quantity} × {formatRupees(item.unitPrice)}</AppText></View><AppText variant="bodyStrong">{formatRupees(item.lineTotal)}</AppText></View>)}</View>
    <View style={styles.card}><AppText variant="sectionTitle">Price summary</AppText><View style={styles.summaryRow}><AppText color="textMuted">Subtotal</AppText><AppText variant="priceLg">{formatRupees(order.subtotal)}</AppText></View></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: gutter, gap: spacing.lg },
  state: { flex: 1, gap: spacing.sm, padding: gutter, backgroundColor: colors.canvas },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  card: { gap: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  item: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemCopy: { flex: 1, gap: spacing.xxs },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
