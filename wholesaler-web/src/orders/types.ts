export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export interface WholesalerOrderItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface WholesalerOrder {
  id: string;
  status: OrderStatus;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  retailer: {
    id: string;
    phoneNumber: string;
  };
  items: WholesalerOrderItem[];
}

export interface UpdateOrderStatusResponse {
  id: string;
  status: OrderStatus;
  updatedAt: string;
}