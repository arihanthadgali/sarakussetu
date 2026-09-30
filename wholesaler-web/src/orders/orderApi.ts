import { apiRequest } from "../api/client";
import type {
  OrderStatus,
  UpdateOrderStatusResponse,
  WholesalerOrder,
} from "./types";

const WHOLESALER_ORDERS_BASE = "/api/wholesaler/orders";

export function getWholesalerOrders(): Promise<WholesalerOrder[]> {
  return apiRequest<WholesalerOrder[]>(
    WHOLESALER_ORDERS_BASE,
    {
      authenticated: true,
    },
  );
}

export function updateWholesalerOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<UpdateOrderStatusResponse> {
  return apiRequest<UpdateOrderStatusResponse>(
    `${WHOLESALER_ORDERS_BASE}/${orderId}/status`,
    {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify({ status }),
    },
  );
}