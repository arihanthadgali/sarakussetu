import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProducts } from '@/api/products';
import { StickyCartBar, STICKY_CART_HEIGHT } from '@/components/cart/StickyCartBar';
import { AppText, SearchField } from '@/components/ui';
import { useSession } from '@/features/auth/session-store';
import { useCartSummary, useServerCart, useSetServerCartQuantity } from '@/features/cart/cart-store';
import { useGuestCart } from '@/features/cart/guest-cart-store';
import { CategoryTabs } from '@/features/home/components/CategoryTabs';
import { ProductSection } from '@/features/home/components/ProductSection';
import { categories } from '@/features/home/categories';
import { categoryForProduct, toHomeProduct } from '@/features/home/product-presentation';
import type { CategoryKey } from '@/features/home/types';
import { colors, gutter, spacing } from '@/theme';

type ShopScreenProps = { onViewCart: () => void };
const shopCategories = [{ key: 'all' as const, label: 'All' }, ...categories];

export function ShopScreen({ onViewCart }: ShopScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | 'all'>('all');
  const [query, setQuery] = useState('');
  const signedIn = useSession((state) => state.status === 'signedIn');
  const guestLines = useGuestCart((state) => state.lines);
  const { data: cart, isLoading: cartLoading, error: cartError, refetch: refetchCart } = useServerCart();
  const { data: products = [], isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
  const setQuantity = useSetServerCartQuantity();
  const summary = useCartSummary();

  const cartLines = useMemo(
    () => signedIn
      ? Object.fromEntries((cart?.items ?? []).map((item) => [String(item.product.id), item.quantity]))
      : Object.fromEntries(Object.values(guestLines).map((item) => [String(item.product.id), item.quantity])),
    [cart, guestLines, signedIn],
  );
  const trimmedQuery = query.trim().toLowerCase();
  const visibleProducts = useMemo(() => products
    .filter((product) => {
      if (!trimmedQuery) return selectedCategory === 'all' || categoryForProduct(product) === selectedCategory;
      return `${product.name} ${product.description ?? ''}`.toLowerCase().includes(trimmedQuery);
    })
    .map(toHomeProduct), [products, selectedCategory, trimmedQuery]);

  const changeQuantity = (productId: string, quantity: number) => {
    const product = products.find((item) => item.id === Number(productId));
    setQuantity.mutate({ productId: Number(productId), quantity, product });
  };
  const retry = () => {
    void refetchProducts();
    if (signedIn) void refetchCart();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.chrome}>
        <View style={styles.header}>
          <AppText variant="screenTitle">Shop</AppText>
          <SearchField value={query} onChangeText={setQuery} />
        </View>
        <CategoryTabs categories={shopCategories} selected={selectedCategory} onSelect={setSelectedCategory} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: (summary.productCount > 0 ? STICKY_CART_HEIGHT : 0) + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {productsLoading || cartLoading ? <View style={styles.state}><AppText>Loading products…</AppText></View> : null}
        {productsError || cartError ? <View style={styles.state}><AppText variant="bodyStrong">Unable to load the catalogue.</AppText><Pressable onPress={retry}><AppText color="primaryText">Retry</AppText></Pressable></View> : null}
        {!(productsLoading || cartLoading || productsError || cartError) && visibleProducts.length > 0 ? (
          <ProductSection title={trimmedQuery ? 'Search results' : shopCategories.find((category) => category.key === selectedCategory)?.label ?? 'Products'} products={visibleProducts} cartLines={cartLines} onChangeQty={changeQuantity} />
        ) : null}
        {!(productsLoading || cartLoading || productsError || cartError) && visibleProducts.length === 0 ? (
          <View style={styles.state}>
            <AppText variant="bodyStrong">{trimmedQuery ? 'No products found' : 'No products available'}</AppText>
            {trimmedQuery ? <Pressable onPress={() => setQuery('')}><AppText color="primaryText">Clear search</AppText></Pressable> : null}
          </View>
        ) : null}
      </ScrollView>

      <StickyCartBar productCount={summary.productCount} total={summary.total} onViewCart={onViewCart} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.chrome },
  chrome: { backgroundColor: colors.chrome },
  header: { paddingHorizontal: gutter, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.lg },
  scroll: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingTop: spacing.xl, gap: spacing.xl },
  state: { paddingHorizontal: gutter, gap: spacing.sm },
});
