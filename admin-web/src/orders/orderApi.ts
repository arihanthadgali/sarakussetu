import { apiRequest } from "../api/client";

import type {
  AdminOrder,
  AdminWholesaler,
  AssignOrderResponse,
} from "./types";

const ADMIN_BASE = "/api/admin";

export function getUnassignedOrders(): Promise<AdminOrder[]> {
  return apiRequest<AdminOrder[]>(
    `${ADMIN_BASE}/orders/unassigned`,
    {
      authenticated: true,
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