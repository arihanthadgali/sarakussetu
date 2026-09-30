import { apiRequest } from "../api/client";

export type PaymentSession = {
  type: "created" | "pending" | "paid";
  keyId?: string;
  payment: { id: string; amount: number; status: string; providerOrderId: string };
};

export const startPayment = (orderId: string) =>
  apiRequest<PaymentSession>(`/api/orders/${orderId}/payment`, { method: "POST", authenticated: true });

export const verifyPayment = (orderId: string, payment: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
  apiRequest<PaymentSession>(`/api/orders/${orderId}/payment/verify`, { method: "POST", authenticated: true, body: JSON.stringify(payment) });

export const completeDevelopmentPayment = (orderId: string) =>
  apiRequest<PaymentSession>(`/api/orders/${orderId}/payment/development/confirm`, { method: "POST", authenticated: true });
