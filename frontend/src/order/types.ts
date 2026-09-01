export type OrderItem = {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  status: string;
  subtotal: number;
  createdAt: string;
  items: OrderItem[];
};

export type OrderDetails = Order;