export type WholesalerOrderStatus =
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

export interface WholesalerRetailer {
  id: string;
  phoneNumber: string;
}

export interface WholesalerOrder {
  id: string;
  status: WholesalerOrderStatus;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  retailer: WholesalerRetailer;
  items: WholesalerOrderItem[];
}

export interface UpdateWholesalerOrderStatusResponse {
  id: string;
  status: WholesalerOrderStatus;
  updatedAt: string;
}
