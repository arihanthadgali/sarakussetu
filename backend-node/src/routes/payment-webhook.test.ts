import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createPaymentWebhookRouter } from "./payment-webhook.js";

describe("payment webhook route", () => {
  it("accepts a valid captured event and rejects invalid signatures", async () => {
    const database = { payment: { findUnique: vi.fn().mockResolvedValue({ id: 1n, status: "PENDING" }), update: vi.fn().mockResolvedValue({}) } }; const router = createPaymentWebhookRouter({ database: database as never, verifyWebhook: () => true }); const route = router.stack[0]?.route; if (route === undefined) throw new Error("Webhook route missing"); const res = { status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res); const req = { get: () => "signature", rawBody: Buffer.from("{}"), body: { event: "payment.captured", payload: { payment: { entity: { order_id: "order_1", id: "pay_1" } } } } } as unknown as Request;
    await route.stack[0]?.handle(req, res as unknown as Response, vi.fn()); expect(database.payment.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }));
    const invalidRouter = createPaymentWebhookRouter({ database: database as never, verifyWebhook: () => false }); const invalidRoute = invalidRouter.stack[0]?.route; const invalid = { status: vi.fn(), json: vi.fn() }; invalid.status.mockReturnValue(invalid); await invalidRoute?.stack[0]?.handle(req, invalid as unknown as Response, vi.fn()); expect(invalid.status).toHaveBeenCalledWith(400);
  });
});
