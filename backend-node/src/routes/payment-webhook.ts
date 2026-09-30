import type { PrismaClient } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";
import { verifyRazorpayWebhookSignature } from "../payments/razorpay.js";

type Database = Pick<PrismaClient, "payment">;
type WebhookBody = { event?: unknown; payload?: { payment?: { entity?: { order_id?: unknown; id?: unknown } } } };

export function createPaymentWebhookRouter({ database, verifyWebhook = verifyRazorpayWebhookSignature }: { database: Database; verifyWebhook?: typeof verifyRazorpayWebhookSignature }) {
  const receive = async (request: Request, response: Response, next: NextFunction) => { try { const signature = request.get("x-razorpay-signature"); const rawBody = (request as Request & { rawBody?: Buffer }).rawBody; if (signature === undefined || rawBody === undefined || !verifyWebhook(rawBody, signature)) { response.status(400).json({ error: "Invalid Razorpay webhook signature" }); return; } const body = request.body as WebhookBody; const entity = body.payload?.payment?.entity; if ((body.event !== "payment.captured" && body.event !== "payment.failed") || typeof entity?.order_id !== "string" || typeof entity.id !== "string") { response.status(200).json({ received: true }); return; } const payment = await database.payment.findUnique({ where: { providerOrderId: entity.order_id }, select: { id: true, status: true } }); if (payment === null) { response.status(200).json({ received: true }); return; } if (body.event === "payment.captured" && payment.status !== "PAID") await database.payment.update({ where: { id: payment.id }, data: { status: "PAID", providerPaymentId: entity.id, paidAt: new Date(), updatedAt: new Date() } }); if (body.event === "payment.failed" && payment.status === "PENDING") await database.payment.update({ where: { id: payment.id }, data: { status: "FAILED", providerPaymentId: entity.id, updatedAt: new Date() } }); response.status(200).json({ received: true }); } catch (error) { next(error); } };
  const router = Router(); router.post("/", receive); return router;
}
