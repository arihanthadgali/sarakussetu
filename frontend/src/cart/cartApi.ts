import { apiRequest } from "../api/client";

export type CartProduct = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

export type CartItem = {
  id: string;
  quantity: number;
  product: CartProduct;
  lineTotal: number;
};

export type Cart = {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
};

export async function getCart(): Promise<Cart> {
  return apiRequest<Cart>("/api/cart", {
    method: "GET",
    authenticated: true,
  });
}

export async function addToCart(
  productId: number,
  quantity = 1,
): Promise<CartItem> {
  return apiRequest<CartItem>("/api/cart/items", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({
      productId,
      quantity,
    }),
  });
}

export async function updateCartItem(
  cartItemId: string,
  quantity: number,
): Promise<CartItem> {
  return apiRequest<CartItem>(`/api/cart/items/${cartItemId}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({
      quantity,
    }),
  });
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  return apiRequest<void>(`/api/cart/items/${cartItemId}`, {
    method: "DELETE",
    authenticated: true,
  });
}