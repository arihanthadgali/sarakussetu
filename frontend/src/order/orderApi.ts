import { apiRequest } from "../api/client";
import type { Order, OrderDetails } from "./types";

export async function getOrders(): Promise<Order[]> {
  return apiRequest<Order[]>("/api/orders", {
    method: "GET",
    authenticated: true,
  });
}

export async function getOrderDetails(
  orderId: string,
): Promise<OrderDetails> {
  return apiRequest<OrderDetails>(`/api/orders/${orderId}`, {
    method: "GET",
    authenticated: true,
  });
}

export async function createOrder(): Promise<OrderDetails> {
  return apiRequest<OrderDetails>("/api/orders", {
    method: "POST",
    authenticated: true,
  });
}