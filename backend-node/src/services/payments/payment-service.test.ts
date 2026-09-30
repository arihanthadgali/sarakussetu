import { Decimal } from "@prisma/client/runtime/library";
import { describe, expect, it, vi } from "vitest";
import { createPaymentService } from "./payment-service.js";

const payment = { id: 9n, amount: new Decimal("950.00"), status: "PENDING", provider: "RAZORPAY", providerOrderId: "order_1", providerPaymentId: null, paidAt: null };
const createDatabase = () => ({ order: { findFirst: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 1 }) }, payment: { create: vi.fn(), update: vi.fn() } });

describe("payment service", () => {
  it("confirms an owned pending order with a development payment exactly once", async () => {
    const database = createDatabase();
    database.order.findFirst.mockResolvedValueOnce({ id: 1n, status: "PENDING", subtotal: new Decimal("950.00"), payment: null }).mockResolvedValueOnce({ id: 1n, status: "CONFIRMED", subtotal: new Decimal("950.00"), payment: { ...payment, status: "PAID" } });
    database.payment.create.mockResolvedValue({ ...payment, status: "PAID", provider: "DEVELOPMENT", providerPaymentId: "development_payment_1", paidAt: new Date() });
    const service = createPaymentService({ database: database as never });
    expect((await service.completeDevelopmentPayment(7n, 1n)).type).toBe("success");
    expect(database.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1n, customerId: 7n, status: "PENDING" }, data: expect.objectContaining({ status: "CONFIRMED" }) }));
    await service.completeDevelopmentPayment(7n, 1n);
    expect(database.payment.create).toHaveBeenCalledTimes(1);
  });
  it("rejects another retailer and orders outside the pending payment state", async () => {
    const database = createDatabase(); const service = createPaymentService({ database: database as never });
    database.order.findFirst.mockResolvedValueOnce(null); expect((await service.completeDevelopmentPayment(7n, 1n)).type).toBe("not_found");
    database.order.findFirst.mockResolvedValueOnce({ id: 1n, status: "PROCESSING", subtotal: new Decimal("950.00"), payment: null }); expect((await service.completeDevelopmentPayment(7n, 1n)).type).toBe("invalid_state");
    expect(database.payment.create).not.toHaveBeenCalled();
  });
  it("uses the server-side order subtotal to create a pending payment", async () => {
    const database = createDatabase(); database.order.findFirst.mockResolvedValue({ id: 1n, status: "PENDING", subtotal: new Decimal("950.00"), payment: null }); database.payment.create.mockResolvedValue(payment); const provider = vi.fn().mockResolvedValue({ id: "order_1", amount: 95000, currency: "INR" });
    const service = createPaymentService({ database: database as never, createProviderOrder: provider, keyId: "rzp_test" }); const result = await service.startPayment(7n, 1n);
    expect(provider).toHaveBeenCalledWith(95000, "order_1"); expect(database.payment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ orderId: 1n, amount: new Decimal("950.00") }) })); expect(result.type).toBe("created");
  });
  it("rejects cancelled and unowned orders", async () => { const database = createDatabase(); const service = createPaymentService({ database: database as never, createProviderOrder: vi.fn() }); database.order.findFirst.mockResolvedValueOnce(null); expect((await service.startPayment(7n, 1n)).type).toBe("not_found"); database.order.findFirst.mockResolvedValueOnce({ id: 1n, status: "CANCELLED", subtotal: new Decimal("950.00"), payment: null }); expect((await service.startPayment(7n, 1n)).type).toBe("cancelled"); });
  it("verifies a matching signature and is idempotent for paid payments", async () => { const database = createDatabase(); const provider = vi.fn(); database.order.findFirst.mockResolvedValueOnce({ id: 1n, payment }).mockResolvedValueOnce({ id: 1n, payment: { ...payment, status: "PAID", providerPaymentId: "pay_1", paidAt: new Date() } }); database.payment.update.mockResolvedValue({ ...payment, status: "PAID", providerPaymentId: "pay_1", paidAt: new Date() }); const service = createPaymentService({ database: database as never, createProviderOrder: provider, verifySignature: () => true }); expect((await service.verifyPayment(7n, 1n, "order_1", "pay_1", "signature")).type).toBe("success"); expect(database.payment.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) })); await service.verifyPayment(7n, 1n, "order_1", "pay_1", "signature"); expect(database.payment.update).toHaveBeenCalledTimes(1); });
  it("rejects invalid signatures and mismatched references without updates", async () => { const database = createDatabase(); database.order.findFirst.mockResolvedValue({ id: 1n, payment }); const service = createPaymentService({ database: database as never, createProviderOrder: vi.fn(), verifySignature: () => false }); expect((await service.verifyPayment(7n, 1n, "other", "pay_1", "signature")).type).toBe("reference_mismatch"); expect((await service.verifyPayment(7n, 1n, "order_1", "pay_1", "signature")).type).toBe("invalid_signature"); expect(database.payment.update).not.toHaveBeenCalled(); });
});
