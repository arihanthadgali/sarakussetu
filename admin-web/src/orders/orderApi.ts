import { apiRequest } from "../api/client";

import type {
  AdminOrder,
  AdminWholesaler,
  AssignOrderResponse,
  DeliveryStatus,
  UpdateDeliveryResponse,
} from "./types";

const ADMIN_BASE = "/api/admin";

export function getOrders(): Promise<AdminOrder[]> {
  return apiRequest<AdminOrder[]>(
    `${ADMIN_BASE}/orders`,
    {
      authenticated: true,
    },
  );
}

export function updateDelivery(
  orderId: string,
  status: DeliveryStatus,
  deliveryPersonName?: string,
  deliveryPersonPhone?: string,
): Promise<UpdateDeliveryResponse> {
  return apiRequest<UpdateDeliveryResponse>(
    `${ADMIN_BASE}/orders/${orderId}/delivery`,
    {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify({
        status,
        ...(deliveryPersonName === undefined ? {} : { deliveryPersonName }),
        ...(deliveryPersonPhone === undefined ? {} : { deliveryPersonPhone }),
      }),
    },
  );
}

export function getWholesalers(): Promise<AdminWholesaler[]> {
  return apiRequest<AdminWholesaler[]>(
    `${ADMIN_BASE}/wholesalers`,
    {
      authenticated: true,
    },
  );
}

export function assignOrder(
  orderId: string,
  wholesalerId: string,
): Promise<AssignOrderResponse> {
  return apiRequest<AssignOrderResponse>(
    `${ADMIN_BASE}/orders/${orderId}/wholesaler`,
    {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify({
        wholesalerId,
      }),
    },
  );
}
