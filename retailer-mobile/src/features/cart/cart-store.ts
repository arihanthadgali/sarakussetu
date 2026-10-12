import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addCartItem, getCart, removeCartItem, updateCartItem, type Cart } from '@/api/cart';
import { useSession } from '@/features/auth/session-store';
import { useGuestCart } from './guest-cart-store';
import type { Product } from '@/api/products';

export const cartQueryKey = ['cart'] as const;
export function useServerCart() { const signedIn = useSession((state) => state.status === 'signedIn'); return useQuery({ queryKey: cartQueryKey, queryFn: getCart, enabled: signedIn }); }
export function useCartSummary() { const signedIn = useSession((state) => state.status === 'signedIn'); const { data } = useServerCart(); const guest = useGuestCart((state) => state.lines); if (!signedIn) { const items = Object.values(guest); return { productCount: items.reduce((total, item) => total + item.quantity, 0), total: items.reduce((total, item) => total + item.quantity * item.product.price, 0) }; } return { productCount: data?.itemCount ?? 0, total: data?.subtotal ?? 0 }; }
export function useSetServerCartQuantity() {
  const client = useQueryClient();
  const signedIn = useSession((state) => state.status === 'signedIn');
  const guestLines = useGuestCart((state) => state.lines);
  const setGuestQuantity = useGuestCart((state) => state.setQuantity);
  return useMutation({
    mutationFn: async ({ productId, quantity, product }: { productId: number; quantity: number; product?: Product }) => {
      if (!signedIn) { const line = guestLines[productId]; if (line) setGuestQuantity(line.product, quantity); else if (product && quantity > 0) setGuestQuantity(product, quantity); return; }
      const cart = client.getQueryData<Cart>(cartQueryKey);
      const line = cart?.items.find((item) => item.product.id === productId);
      if (line === undefined) { if (quantity > 0) await addCartItem(productId, quantity); return; }
      if (quantity <= 0) { await removeCartItem(line.id); return; }
      await updateCartItem(line.id, quantity);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: cartQueryKey }),
  });
}
