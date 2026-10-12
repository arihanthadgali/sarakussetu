import { StyleSheet, View } from 'react-native';

import { gutter, spacing } from '@/theme';

import type { HomeProduct } from '../types';
import { ProductCard } from './ProductCard';
import { SectionHeader } from './SectionHeader';

type Props = {
  title: string;
  products: HomeProduct[];
  cartLines: Record<string, number>;
  onChangeQty: (productId: string, quantity: number) => void;
  onSeeAll?: () => void;
};

/** Two-column grid; rows are chunked so an odd last card keeps its width. */
export function ProductSection({ title, products, cartLines, onChangeQty, onSeeAll }: Props) {
  const rows: HomeProduct[][] = [];
  for (let index = 0; index < products.length; index += 2) rows.push(products.slice(index, index + 2));

  return (
    <View style={styles.section}>
      <SectionHeader title={title} actionLabel={onSeeAll ? 'See all' : undefined} actionIcon onAction={onSeeAll} />
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row.map((product) => product.id).join('|')} style={styles.row}>
            {row.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQty={cartLines[product.id] ?? 0}
                onChangeCartQty={(quantity) => onChangeQty(product.id, quantity)}
              />
            ))}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: gutter, gap: spacing.lg },
  grid: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' },
  spacer: { flex: 1 },
});
