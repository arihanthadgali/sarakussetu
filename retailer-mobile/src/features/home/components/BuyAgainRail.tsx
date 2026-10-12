import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AppText, Card } from '@/components/ui';
import { formatRupees } from '@/lib/format';
import { colors, gutter, radius, spacing } from '@/theme';

import type { HomeProduct } from '../types';

export type BuyAgainEntry = { product: HomeProduct; lastQty: number; inCartQty: number };

type Props = { entries: BuyAgainEntry[]; onAdd: (entry: BuyAgainEntry) => void };

export function BuyAgainRail({ entries, onAdd }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {entries.map((entry) => (
        <BuyAgainCard key={entry.product.id} entry={entry} onAdd={() => onAdd(entry)} />
      ))}
    </ScrollView>
  );
}

function BuyAgainCard({ entry, onAdd }: { entry: BuyAgainEntry; onAdd: () => void }) {
  const { product, lastQty, inCartQty } = entry;
  const inCart = inCartQty > 0;

  return (
    <Card style={styles.card}>
      <AppText variant="title" numberOfLines={1}>
        {product.name}
      </AppText>
      <AppText variant="caption" color="textMuted" style={styles.last}>
        Last time: {lastQty} {product.unit}
      </AppText>
      <AppText variant="bodyStrong" style={styles.price}>
        {formatRupees(product.price)} / {product.unit}
      </AppText>

      {inCart ? (
        <View style={[styles.pill, styles.pillInCart]} accessibilityLabel={`${product.name} in cart, ${inCartQty} ${product.unit}`}>
          <Feather name="check" size={18} color={colors.primary} />
          <AppText variant="bodyStrong" color="primaryText">
            In cart · {inCartQty} {product.unit}
          </AppText>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${lastQty} ${product.unit} of ${product.name}`}
          onPress={onAdd}
          style={({ pressed }) => [styles.pill, styles.pillAdd, pressed && styles.pillPressed]}
        >
          <Feather name="plus" size={18} color={colors.primary} />
          <AppText variant="bodyStrong" color="primaryText">
            Add {lastQty} {product.unit}
          </AppText>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  rail: { paddingHorizontal: gutter, gap: spacing.md },
  card: { width: 176, padding: spacing.lg },
  last: { marginTop: spacing.xs, fontSize: 14 },
  price: { marginTop: spacing.xs, fontSize: 16 },
  pill: {
    marginTop: spacing.lg,
    minHeight: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  pillInCart: { backgroundColor: colors.surfaceSuccess },
  pillAdd: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  pillPressed: { backgroundColor: colors.surfaceSuccess },
});
