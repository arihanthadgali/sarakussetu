import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import type { ActiveOrderSummary } from '../types';

type Props = { order: ActiveOrderSummary; onTrack?: () => void };

export function ActiveOrderCard({ order, onTrack }: Props) {
  const itemsLabel = `${order.itemCount} item${order.itemCount === 1 ? '' : 's'}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.displayId}, ${order.statusLabel}, ${itemsLabel}. Track order`}
      onPress={onTrack}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWell}>
        <Feather name="truck" size={22} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText variant="title">
          Order #{order.displayId} · {order.statusLabel}
        </AppText>
        <AppText variant="caption" color="textMuted" style={styles.sub}>
          {itemsLabel} · {order.note}
        </AppText>
      </View>
      <View style={styles.track}>
        <AppText variant="bodyStrong" color="primaryText">
          Track
        </AppText>
        <Feather name="arrow-right" size={18} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
  pressed: { backgroundColor: colors.surfaceSuccess },
  iconWell: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSuccess,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  sub: { marginTop: spacing.xs, fontSize: 14 },
  track: { alignItems: 'flex-start' },
});
