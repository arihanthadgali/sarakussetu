import type { PrismaClient } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";
import { requireAuthentication } from "../../middleware/authentication.js";
import { requireAdminAuthentication } from "../../middleware/admin-authentication.js";

type Database = Pick<PrismaClient, "payment">;

export function createAdminPaymentsRouter({ database }: { database: Database }) {
  const list = async (request: Request, response: Response, next: NextFunction) => { try { const status = request.query.status; if (status !== undefined && status !== "PENDING" && status !== "PAID" && status !== "FAILED") { response.status(400).json({ error: "Invalid payment status" }); return; } const payments = await database.payment.findMany({ where: status === undefined ? undefined : { status }, orderBy: { createdAt: "desc" }, select: { id: true, amount: true, status: true, provider: true, providerOrderId: true, providerPaymentId: true, paidAt: true, createdAt: true, order: { select: { id: true, status: true, customer: { select: { id: true, phoneNumber: true } }, wholesaler: { select: { id: true, businessName: true } } } } } }); response.status(200).json(payments.map((payment) => ({ id: payment.id.toString(), amount: payment.amount.toNumber(), status: payment.status, provider: payment.provider, providerOrderId: payment.providerOrderId, providerPaymentId: payment.providerPaymentId, paidAt: payment.paidAt?.toISOString() ?? null, createdAt: payment.createdAt.toISOString(), order: { id: payment.order.id.toString(), status: payment.order.status, retailer: { id: payment.order.customer.id.toString(), phoneNumber: payment.order.customer.phoneNumber }, wholesaler: payment.order.wholesaler === null ? null : { id: payment.order.wholesaler.id.toString(), businessName: payment.order.wholesaler.businessName } } }))); } catch (error) { next(error); } };
  const router = Router(); router.get("/", requireAuthentication, requireAdminAuthentication, list); return router;
}
