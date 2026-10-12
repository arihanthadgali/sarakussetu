import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText, QuantityStepper, StatusBadge, type BadgeTone } from '@/components/ui';
import { formatRupees, pluralizeUnit } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';
import { resolveProductImageUrl } from '@/api/products';

import { decrementQuantity, incrementQuantity, lineTotalFor } from '../pricing';
import type { HomeProduct, StockLevel } from '../types';

const stockBadge: Record<StockLevel, { label: string; tone: BadgeTone }> = {
  in_stock: { label: 'In stock', tone: 'success' },
  low_stock: { label: 'Low stock', tone: 'warning' },
  out_of_stock: { label: 'Out of stock', tone: 'danger' },
};

type Props = {
  product: HomeProduct;
  /** 0 when the product is not in the cart. */
  cartQty: number;
  onChangeCartQty: (quantity: number) => void;
};

/**
 * In the cart: the stepper edits the cart directly and the footer confirms the line total.
 * Not in the cart: the stepper picks a quantity (starting at the minimum) and
 * "Add · ₹total" commits it — the retailer sees the cost before adding.
 */
export function ProductCard({ product, cartQty, onChangeCartQty }: Props) {
  const inCart = cartQty > 0;
  const [draftQty, setDraftQty] = useState(product.minQty);
  const quantity = inCart ? cartQty : draftQty;
  const lineTotal = lineTotalFor(product, quantity);
  const unavailable = product.stock === 'out_of_stock';
  const badge = stockBadge[product.stock];
  const imageUri = resolveProductImageUrl(product.imageUrl);

  const decrement = () => {
    const next = decrementQuantity(product, quantity);
    if (inCart) onChangeCartQty(next);
    else setDraftQty(Math.max(next, product.minQty));
  };
  const increment = () => {
    const next = incrementQuantity(product, quantity);
    if (inCart) onChangeCartQty(next);
    else setDraftQty(next);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageWell}>
        {product.bulk ? (
          <View style={styles.bulkTag}>
            <AppText variant="captionStrong" color="primaryText">
              Bulk price
            </AppText>
          </View>
        ) : null}
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" accessibilityLabel={`${product.name} product image`} /> : <MaterialCommunityIcons name={product.icon} size={52} color={colors.successFg} style={styles.icon} />}
      </View>

      <View style={styles.body}>
        <AppText variant="title" numberOfLines={2}>
          {product.name}
        </AppText>
        <AppText variant="caption" color="textMuted" style={styles.pack} numberOfLines={1}>
          {product.packLabel}
        </AppText>

        <View style={styles.priceRow}>
          <AppText variant="priceLg">{formatRupees(product.price)}</AppText>
          <AppText variant="caption" color="textMuted" style={styles.perUnit}>
            / {product.unit}
          </AppText>
        </View>

        {product.bulk ? (
          <View style={styles.bulkRow}>
            <Feather name="trending-down" size={14} color={colors.successFg} />
            <AppText variant="captionStrong" color="successFg" style={styles.bulkText}>
              {formatRupees(product.bulk.price)} / {product.unit} for {product.bulk.minQty}+{' '}
              {pluralizeUnit(product.unit, product.bulk.minQty)}
            </AppText>
          </View>
        ) : null}

        <View style={styles.badgeRow}>
          <StatusBadge label={badge.label} tone={badge.tone} />
        </View>

        {unavailable ? null : (
          <View style={styles.controls}>
            <QuantityStepper
              quantity={quantity}
              unit={product.unit}
              productName={product.name}
              onDecrement={decrement}
              onIncrement={increment}
              decrementDisabled={!inCart && quantity <= product.minQty}
            />
            {inCart ? (
              <View style={[styles.action, styles.actionInCart]} accessibilityLabel={`In cart, ${formatRupees(lineTotal)}`}>
                <Feather name="check" size={16} color={colors.primary} />
                <AppText variant="label" color="primaryText">
                  In cart · {formatRupees(lineTotal)}
                </AppText>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${quantity} ${product.unit} of ${product.name} for ${formatRupees(lineTotal)}`}
                onPress={() => onChangeCartQty(quantity)}
                style={({ pressed }) => [styles.action, styles.actionAdd, pressed && styles.actionPressed]}
              >
                <AppText variant="label" color="textOnPrimary">
                  Add · {formatRupees(lineTotal)}
                </AppText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  imageWell: { height: 112, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  icon: { opacity: 0.85 },
  bulkTag: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  body: { padding: spacing.md, paddingTop: spacing.lg, gap: spacing.xxs },
  pack: { fontSize: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs },
  perUnit: { fontSize: 14 },
  bulkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bulkText: { flexShrink: 1 },
  badgeRow: { marginTop: spacing.sm },
  controls: { marginTop: spacing.md, gap: spacing.sm },
  action: {
    minHeight: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionInCart: { backgroundColor: colors.surfaceSuccess },
  actionAdd: { backgroundColor: colors.primary },
  actionPressed: { backgroundColor: colors.primaryPressed },
});
