import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import { formatRupees } from '@/lib/format';
import { colors, gutter, radius, shadows, spacing } from '@/theme';

type Props = {
  productCount: number;
  total: number;
  onViewCart: () => void;
};

/** Deep-green summary bar pinned above the tab bar while the cart has lines. */
export function StickyCartBar({ productCount, total, onViewCart }: Props) {
  if (productCount === 0) return null;
  const summary = `${productCount} product${productCount === 1 ? '' : 's'} · ${formatRupees(total)}`;

  return (
    <View style={styles.bar}>
      <Feather name="shopping-cart" size={26} color={colors.textOnPrimary} />
      <View style={styles.copy}>
        <AppText variant="title" color="textOnPrimary" numberOfLines={1}>
          {summary}
        </AppText>
        {/* Design copy. NOTE: the backend has no GST today — see Phase 1 report. */}
        <AppText variant="caption" style={styles.sub}>
          GST added at checkout
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View cart, ${summary}`}
        onPress={onViewCart}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <AppText variant="bodyStrong" color="textOnCta">
          View cart
        </AppText>
        <Feather name="arrow-right" size={18} color={colors.textOnCta} />
      </Pressable>
    </View>
  );
}

export const STICKY_CART_HEIGHT = 84;

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: STICKY_CART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: gutter,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    ...shadows.floating,
  },
  copy: { flex: 1 },
  sub: { color: '#CFE0D2', marginTop: spacing.xxs },
  cta: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.cta,
  },
  ctaPressed: { backgroundColor: colors.ctaPressed },
});
