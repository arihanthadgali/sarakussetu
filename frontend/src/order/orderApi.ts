import { apiRequest } from "../api/client";
import type { Order } from "./types";

export async function getOrders(): Promise<Order[]> {
  return apiRequest<Order[]>("/api/orders", {
    method: "GET",
    authenticated: true,
  });
}

export async function getOrderDetails(orderId: string): Promise<Order> {
  return apiRequest<Order>(`/api/orders/${orderId}`, {
    method: "GET",
    authenticated: true,
  });
}