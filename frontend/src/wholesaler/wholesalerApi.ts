import { apiRequest } from "../api/client";
import type {
  UpdateWholesalerOrderStatusResponse,
  WholesalerOrder,
  WholesalerOrderStatus,
} from "./types";

export function getWholesalerOrders(): Promise<WholesalerOrder[]> {
  return apiRequest<WholesalerOrder[]>("/api/wholesaler/orders", {
    method: "GET",
    authenticated: true,
  });
}

export function updateWholesalerOrderStatus(
  orderId: string,
  status: WholesalerOrderStatus,
): Promise<UpdateWholesalerOrderStatusResponse> {
  return apiRequest<UpdateWholesalerOrderStatusResponse>(
    `/api/wholesaler/orders/${orderId}/status`,
    {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify({ status }),
    },
  );
}
