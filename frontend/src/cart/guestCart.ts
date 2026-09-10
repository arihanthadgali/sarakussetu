import type { Product } from "../product/types";

const STORAGE_KEY = "sarakussetu_guest_cart";

export type GuestCartItem = {
  product: Product;
  quantity: number;
};

function readCart(): GuestCartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function writeCart(items: GuestCartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getGuestCart(): GuestCartItem[] {
  return readCart();
}

export function addGuestCartItem(
  product: Product,
  quantity = 1,
): GuestCartItem[] {
  const items = readCart();
  const existing = items.find((item) => item.product.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      product,
      quantity,
    });
  }

  writeCart(items);
  return items;
}

export function updateGuestCartItem(
  productId: number,
  quantity: number,
): GuestCartItem[] {
  const items = readCart();

  if (quantity < 1) {
    return removeGuestCartItem(productId);
  }

  const item = items.find((entry) => entry.product.id === productId);

  if (item) {
    item.quantity = quantity;
  }

  writeCart(items);
  return items;
}

export function removeGuestCartItem(productId: number): GuestCartItem[] {
  const items = readCart().filter(
    (item) => item.product.id !== productId,
  );

  writeCart(items);
  return items;
}

export function clearGuestCart() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getGuestCartTotals(items = readCart()) {
  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  return {
    itemCount,
    subtotal,
  };
}
