import { apiRequest } from "../api/client";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export interface AdminPayment { id: string; amount: number; status: PaymentStatus; provider: string; providerOrderId: string; providerPaymentId: string | null; paidAt: string | null; createdAt: string; order: { id: string; status: string; retailer: { id: string; phoneNumber: string }; wholesaler: { id: string; businessName: string } | null }; }
export const getPayments = (status?: PaymentStatus) => apiRequest<AdminPayment[]>(`/api/admin/payments${status === undefined ? "" : `?status=${status}`}`, { authenticated: true });
