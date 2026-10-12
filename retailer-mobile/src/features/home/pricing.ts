import type { HomeProduct } from './types';

/** Slab price applies once the quantity reaches the bulk threshold. */
export function unitPriceFor(product: Pick<HomeProduct, 'price' | 'bulk'>, quantity: number): number {
  return product.bulk && quantity >= product.bulk.minQty ? product.bulk.price : product.price;
}

export function lineTotalFor(product: Pick<HomeProduct, 'price' | 'bulk'>, quantity: number): number {
  return Math.round(unitPriceFor(product, quantity) * quantity * 100) / 100;
}

export type CartSummary = { productCount: number; total: number };

export function summarizeCart(
  lines: Record<string, number>,
  lookup: (id: string) => Pick<HomeProduct, 'price' | 'bulk'> | undefined,
): CartSummary {
  let productCount = 0;
  let total = 0;
  for (const [id, quantity] of Object.entries(lines)) {
    const product = lookup(id);
    if (!product || quantity <= 0) continue;
    productCount += 1;
    total += lineTotalFor(product, quantity);
  }
  return { productCount, total: Math.round(total * 100) / 100 };
}

/** Next quantity when stepping down; below the minimum means "remove" (0). */
export function decrementQuantity(product: Pick<HomeProduct, 'minQty' | 'step'>, quantity: number): number {
  const next = quantity - product.step;
  return next < product.minQty ? 0 : next;
}

export function incrementQuantity(product: Pick<HomeProduct, 'minQty' | 'step'>, quantity: number): number {
  return quantity < product.minQty ? product.minQty : quantity + product.step;
}
