import { Decimal } from "@prisma/client/runtime/library";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createAdminPaymentsRouter } from "./payments.js";

describe("admin payments route", () => {
  it("returns payment data to an authenticated admin and applies status filters", async () => {
    const database = { payment: { findMany: vi.fn().mockResolvedValue([{ id: 1n, amount: new Decimal("950.00"), status: "PAID", provider: "RAZORPAY", providerOrderId: "order_1", providerPaymentId: "pay_1", paidAt: new Date("2026-01-01T00:00:00.000Z"), createdAt: new Date("2026-01-01T00:00:00.000Z"), order: { id: 10n, status: "PENDING", customer: { id: 3n, phoneNumber: "9876543210" }, wholesaler: null } }]) } };
    const router = createAdminPaymentsRouter({ database: database as never }); const route = router.stack[0]?.route; if (route === undefined) throw new Error("Payments route missing"); const res = { locals: { adminId: 1n }, status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res);
    await route.stack[2]?.handle({ query: { status: "PAID" } } as unknown as Request, res as unknown as Response, vi.fn());
    expect(database.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PAID" } })); expect(res.json).toHaveBeenCalledWith([expect.objectContaining({ amount: 950, order: expect.objectContaining({ id: "10" }) })]);
  });
  it("rejects non-admin access", () => { const router = createAdminPaymentsRouter({ database: { payment: { findMany: vi.fn() } } as never }); const route = router.stack[0]?.route; if (route === undefined) throw new Error("Payments route missing"); const res = { locals: {}, status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res); route.stack[1]?.handle({} as Request, res as unknown as Response, vi.fn()); expect(res.status).toHaveBeenCalledWith(403); });
});
