export type OrderItem = {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export const ORDER_STATUS_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "COMPLETED",
] as const;

export type OrderStatus =
  | (typeof ORDER_STATUS_STEPS)[number]
  | "CANCELLED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Order received",
  CONFIRMED: "Confirmed",
  PROCESSING: "Being prepared",
  READY: "Ready for delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export type Order = {
  id: string;
  status: OrderStatus;
  subtotal: number;
  createdAt: string;
  items: OrderItem[];
};

export type OrderDetails = Order;
