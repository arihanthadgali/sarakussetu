import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StickyCartBar, STICKY_CART_HEIGHT } from '@/components/cart/StickyCartBar';
import { AppText, SearchField } from '@/components/ui';
import { useCartSummary, useServerCart, useSetServerCartQuantity } from '@/features/cart/cart-store';
import { useGuestCart } from '@/features/cart/guest-cart-store';
import { useSession } from '@/features/auth/session-store';
import { getProducts } from '@/api/products';
import { useQuery } from '@tanstack/react-query';
import { colors, gutter, spacing } from '@/theme';

import { ActiveOrderCard } from './components/ActiveOrderCard';
import { CategoryTabs } from './components/CategoryTabs';
import { HomeHeader } from './components/HomeHeader';
import { ProductSection } from './components/ProductSection';
import { SectionHeader } from './components/SectionHeader';
import { categories } from './categories';
import type { CategoryKey } from './types';
import { toHomeProduct } from './product-presentation';
import { activeOrder, useOrders } from '@/features/orders/orders';
import { getOrderStatusPresentation } from '@/features/orders/status';

export type HomeScreenProps = {
  onViewCart: () => void;
  onTrackOrder: () => void;
  onOpenProfile: () => void;
  onOpenShop: () => void;
};

/**
 * Home shell backed by product and cart APIs. Layout follows the approved design:
 * fixed header/search/categories, scrolling body, sticky cart above the tab bar.
 */
export function HomeScreen({ onViewCart, onTrackOrder, onOpenProfile, onOpenShop }: HomeScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('grocery');
  const [query, setQuery] = useState('');

  const { data: cart, isLoading: cartLoading, error: cartError } = useServerCart();
  const signedIn = useSession((state) => state.status === 'signedIn');
  const phoneNumber = useSession((state) => state.customer?.phoneNumber);
  const guestLines = useGuestCart((state) => state.lines);
  const { data: products = [], isLoading: productsLoading, error: productsError, refetch } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const setQuantity = useSetServerCartQuantity();
  const { data: orders } = useOrders();
  const summary = useCartSummary();
  const lines = useMemo(
    () => signedIn
      ? Object.fromEntries((cart?.items ?? []).map((item) => [String(item.product.id), item.quantity]))
      : Object.fromEntries(Object.values(guestLines).map((item) => [String(item.product.id), item.quantity])),
    [cart, guestLines, signedIn],
  );
  const homeProducts = useMemo(() => products.map(toHomeProduct), [products]);
  const currentOrder = activeOrder(orders);

  const trimmedQuery = query.trim().toLowerCase();
  const visibleProducts = useMemo(
    () =>
      trimmedQuery
        ? homeProducts.filter((product) => product.name.toLowerCase().includes(trimmedQuery))
        : homeProducts.filter((product) => product.category === selectedCategory),
    [homeProducts, selectedCategory, trimmedQuery],
  );
  const sectionTitle = trimmedQuery
    ? 'Search results'
    : (categories.find((category) => category.key === selectedCategory)?.label ?? '');

  const changeQuantity = (productId: string, quantity: number) => { const product = products.find((item) => item.id === Number(productId)); setQuantity.mutate({ productId: Number(productId), quantity, product }); };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.chrome}>
        <View style={styles.headerBlock}>
          <HomeHeader
            identityLabel={signedIn ? phoneNumber || 'Retailer account' : 'Browse products'}
            onPressAvatar={onOpenProfile}
          />
          <SearchField value={query} onChangeText={setQuery} />
        </View>
        <CategoryTabs categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (summary.productCount > 0 ? STICKY_CART_HEIGHT : 0) + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {!trimmedQuery ? (
          <>
            <View style={styles.padded}>
              {currentOrder ? <ActiveOrderCard order={{ displayId: currentOrder.id, statusLabel: getOrderStatusPresentation(currentOrder.status).label, itemCount: currentOrder.items.reduce((total, item) => total + item.quantity, 0), note: getOrderStatusPresentation(currentOrder.status).note }} onTrack={onTrackOrder} /> : null}
            </View>

            <View style={styles.block}><View style={styles.padded}><SectionHeader title="Products" /></View></View>
          </>
        ) : null}

        {productsLoading || cartLoading ? <View style={styles.padded}><AppText>Loading products…</AppText></View> : productsError || cartError ? <View style={styles.padded}><AppText variant="bodyStrong">Unable to load products or cart.</AppText><AppText color="textMuted" onPress={() => void refetch()}>Tap to retry</AppText></View> : visibleProducts.length > 0 ? (
          <ProductSection
            title={sectionTitle}
            products={visibleProducts}
            cartLines={lines}
            onChangeQty={changeQuantity}
            onSeeAll={onOpenShop}
          />
        ) : (
          <View style={styles.padded}>
            <AppText variant="bodyStrong">No products match “{query.trim()}”.</AppText>
            <AppText color="textMuted">Try a shorter name, like “rice” or “dal”.</AppText>
          </View>
        )}
      </ScrollView>

      <StickyCartBar productCount={summary.productCount} total={summary.total} onViewCart={onViewCart} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.chrome },
  chrome: { backgroundColor: colors.chrome },
  headerBlock: { paddingHorizontal: gutter, paddingTop: spacing.md, gap: spacing.lg },
  scroll: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingTop: spacing.xl, gap: spacing.xxxl },
  padded: { paddingHorizontal: gutter, gap: spacing.xs },
  block: { gap: spacing.lg },
});
