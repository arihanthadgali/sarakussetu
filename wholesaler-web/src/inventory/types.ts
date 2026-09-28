export interface WholesalerInventoryItem {
  product: {
    id: number;
    name: string;
    price: number;
    active: boolean;
  };
  stockQuantity: number;
  unit: string;
  updatedAt: string;
}
