import { findPricingProduct, pricingCart } from '@/test/pricing-fixtures';
import { decrementQuantity, incrementQuantity, lineTotalFor, summarizeCart, unitPriceFor } from './pricing';

const rice = { price: 1450, bulk: { minQty: 5, price: 1420 } };
const sugar = { minQty: 10, step: 5 };

describe('pricing', () => {
  it('applies the bulk slab from its threshold', () => {
    expect(unitPriceFor(rice, 4)).toBe(1450);
    expect(unitPriceFor(rice, 5)).toBe(1420);
    expect(lineTotalFor(rice, 5)).toBe(7100);
  });

  it('respects minimum order and step', () => {
    expect(incrementQuantity(sugar, 0)).toBe(10);
    expect(incrementQuantity(sugar, 10)).toBe(15);
    expect(decrementQuantity(sugar, 15)).toBe(10);
    expect(decrementQuantity(sugar, 10)).toBe(0); // below minimum -> remove
  });

  it('sums fixture cart quantities and prices (5 products, ₹8,082)', () => {
    expect(summarizeCart(pricingCart, findPricingProduct)).toEqual({ productCount: 5, total: 8082 });
  });
});
