import type { PrismaClient } from "@prisma/client";

import { createRazorpayOrder, type RazorpayOrder, verifyRazorpaySignature } from "../../payments/razorpay.js";

type Database = Pick<PrismaClient, "order" | "payment"> &
  Partial<Pick<PrismaClient, "$transaction" | "admin" | "notification">>;
type CreateProviderOrder = (amount: number, receipt: string) => Promise<RazorpayOrder>;

const serializePayment = (payment: { id: bigint; amount: { toNumber(): number }; status: string; provider: string; providerOrderId: string; providerPaymentId: string | null; paidAt: Date | null }) => ({ id: payment.id.toString(), amount: payment.amount.toNumber(), status: payment.status, provider: payment.provider, providerOrderId: payment.providerOrderId, providerPaymentId: payment.providerPaymentId, paidAt: payment.paidAt?.toISOString() ?? null });

export function createPaymentService({ database, createProviderOrder = createRazorpayOrder, verifySignature = verifyRazorpaySignature, keyId }: { database: Database; createProviderOrder?: CreateProviderOrder; verifySignature?: typeof verifyRazorpaySignature; keyId?: string }) {
  const startPayment = async (customerId: bigint, orderId: bigint) => {
    const order = await database.order.findFirst({ where: { id: orderId, customerId }, select: { id: true, status: true, subtotal: true, payment: { select: { id: true, amount: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, paidAt: true } } } });
    if (order === null) return { type: "not_found" as const };
    if (order.status === "CANCELLED") return { type: "cancelled" as const };
    if (order.payment?.status === "PAID") return { type: "paid" as const, payment: serializePayment(order.payment) };
    if (order.payment?.status === "PENDING") return { type: "pending" as const, payment: serializePayment(order.payment), keyId };
    const amount = order.subtotal.toNumber(); const providerOrder = await createProviderOrder(Math.round(amount * 100), `order_${order.id.toString()}`); const now = new Date();
    const payment = order.payment === null ? await database.payment.create({ data: { orderId: order.id, amount: order.subtotal, status: "PENDING", provider: "RAZORPAY", providerOrderId: providerOrder.id, createdAt: now, updatedAt: now }, select: { id: true, amount: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, paidAt: true } }) : await database.payment.update({ where: { id: order.payment.id }, data: { amount: order.subtotal, status: "PENDING", provider: "RAZORPAY", providerOrderId: providerOrder.id, providerPaymentId: null, paidAt: null, updatedAt: now }, select: { id: true, amount: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, paidAt: true } });
    return { type: "created" as const, payment: serializePayment(payment), keyId };
  };
  const verifyPayment = async (customerId: bigint, orderId: bigint, providerOrderId: string, providerPaymentId: string, signature: string) => {
    const order = await database.order.findFirst({ where: { id: orderId, customerId }, select: { id: true, status: true, payment: { select: { id: true, amount: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, paidAt: true } } } });
    if (order === null || order.payment === null) return { type: "not_found" as const };
    const existingPayment = order.payment;
    if (existingPayment.providerOrderId !== providerOrderId) return { type: "reference_mismatch" as const };
    if (!verifySignature(providerOrderId, providerPaymentId, signature)) return { type: "invalid_signature" as const };
    const paidAt = new Date();
    const finalizePayment = async (transaction: Pick<PrismaClient, "order" | "payment">) => {
      const payment = existingPayment.status === "PAID"
        ? existingPayment
        : await transaction.payment.update({ where: { id: existingPayment.id }, data: { status: "PAID", providerPaymentId, paidAt, updatedAt: paidAt }, select: { id: true, amount: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, paidAt: true } });
      await transaction.order.updateMany({ where: { id: orderId, customerId, status: "PENDING" }, data: { status: "CONFIRMED", updatedAt: paidAt } });
      return payment;
    };
    const payment = database.$transaction === undefined
      ? await finalizePayment(database)
      : await database.$transaction(finalizePayment);
    if (database.admin !== undefined && database.notification !== undefined) { const admins = await database.admin.findMany({ select: { id: true } }); if (admins.length > 0) await database.notification.createMany({ data: admins.map((admin) => ({ adminId: admin.id, title: "Payment received", message: `Payment for order #${orderId.toString()} was received.`, createdAt: paidAt })) }); }
    return { type: "success" as const, payment: serializePayment(payment) };
  };
  const completeDevelopmentPayment = async (customerId: bigint, orderId: bigint) => {
    const order = await database.order.findFirst({ where: { id: orderId, customerId }, select: { id: true, status: true, subtotal: true, payment: { select: { id: true, amount: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, paidAt: true } } } });
    if (order === null) return { type: "not_found" as const };
    if (order.status === "CONFIRMED" && order.payment?.status === "PAID") return { type: "success" as const, payment: serializePayment(order.payment) };
    if (order.status !== "PENDING") return { type: "invalid_state" as const };
    const now = new Date();
    const finalize = async (transaction: Pick<PrismaClient, "order" | "payment">) => {
      const payment = order.payment === null
        ? await transaction.payment.create({ data: { orderId, amount: order.subtotal, status: "PAID", provider: "DEVELOPMENT", providerOrderId: `development_order_${orderId.toString()}`, providerPaymentId: `development_payment_${orderId.toString()}`, paidAt: now, createdAt: now, updatedAt: now }, select: { id: true, amount: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, paidAt: true } })
        : await transaction.payment.update({ where: { id: order.payment.id }, data: { status: "PAID", provider: "DEVELOPMENT", providerPaymentId: order.payment.providerPaymentId ?? `development_payment_${orderId.toString()}`, paidAt: now, updatedAt: now }, select: { id: true, amount: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, paidAt: true } });
      const updated = await transaction.order.updateMany({ where: { id: orderId, customerId, status: "PENDING" }, data: { status: "CONFIRMED", updatedAt: now } });
      if (updated.count === 0) throw new Error("Order payment state changed. Refresh and try again.");
      return payment;
    };
    const payment = database.$transaction === undefined ? await finalize(database) : await database.$transaction(finalize);
    return { type: "success" as const, payment: serializePayment(payment) };
  };
  return { startPayment, verifyPayment, completeDevelopmentPayment };
}
