import type { PrismaClient } from "@prisma/client";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { requireAuthentication } from "../../middleware/authentication.js";
import { requireAdminAuthentication } from "../../middleware/admin-authentication.js";
import {
  canTransitionDeliveryStatus,
  isDeliveryStatus,
} from "../../order/deliveryStatus.js";
import { transitionOrderStatus } from "../../order/orderStatus.js";

type Database = Pick<PrismaClient, "order"> &
  Partial<Pick<PrismaClient, "admin" | "notification">>;

export function createAdminDeliveryRouter({
  database,
}: {
  database: Database;
}) {
  const updateDelivery = async (
    request: Request<{ orderId: string }>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const orderIdValue = request.params.orderId;
      const body = request.body as {
        status?: unknown;
        deliveryPersonName?: unknown;
        deliveryPersonPhone?: unknown;
      } | undefined;
      const nextDeliveryStatus = body?.status;

      if (typeof orderIdValue !== "string" || !/^\d+$/.test(orderIdValue)) {
        response.status(400).json({ error: "Invalid order ID" });
        return;
      }

      if (!isDeliveryStatus(nextDeliveryStatus)) {
        response.status(400).json({ error: "Invalid delivery status" });
        return;
      }

      const orderId = BigInt(orderIdValue);
      const order = await database.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          deliveryStatus: true,
          deliveryPersonName: true,
          deliveryPersonPhone: true,
        },
      });

      if (order === null) {
        response.status(404).json({ error: "Order not found" });
        return;
      }

      if (order.status !== "READY") {
        response.status(409).json({ error: "Order is not ready for delivery" });
        return;
      }

      if (!isDeliveryStatus(order.deliveryStatus)) {
        next(new Error(`Invalid current delivery status: ${order.deliveryStatus}`));
        return;
      }

      if (!canTransitionDeliveryStatus(order.deliveryStatus, nextDeliveryStatus)) {
        response.status(409).json({
          error: `Invalid delivery status transition: ${order.deliveryStatus} -> ${nextDeliveryStatus}`,
        });
        return;
      }

      let deliveryPersonName = order.deliveryPersonName;
      let deliveryPersonPhone = order.deliveryPersonPhone;

      if (nextDeliveryStatus === "ASSIGNED") {
        if (
          typeof body?.deliveryPersonName !== "string" ||
          body.deliveryPersonName.trim() === "" ||
          typeof body.deliveryPersonPhone !== "undefined" &&
            typeof body.deliveryPersonPhone !== "string"
        ) {
          response.status(400).json({ error: "A delivery person name is required" });
          return;
        }

        deliveryPersonName = body.deliveryPersonName.trim();
        deliveryPersonPhone = body.deliveryPersonPhone?.trim() || null;
      }

      const status =
        nextDeliveryStatus === "DELIVERED"
          ? transitionOrderStatus("READY", "COMPLETED")
          : "READY";
      const updatedAt = new Date();
      const result = await database.order.updateMany({
        where: {
          id: orderId,
          status: "READY",
          deliveryStatus: order.deliveryStatus,
        },
        data: {
          status,
          deliveryStatus: nextDeliveryStatus,
          deliveryPersonName,
          deliveryPersonPhone,
          updatedAt,
        },
      });

      if (result.count === 0) {
        response.status(409).json({ error: "Delivery status changed. Refresh and try again." });
        return;
      }

      if (database.admin !== undefined && database.notification !== undefined) {
        const admins = await database.admin.findMany({ select: { id: true } });
        if (admins.length > 0) {
          await database.notification.createMany({
            data: admins.map((admin) => ({
              adminId: admin.id,
              title: nextDeliveryStatus === "DELIVERED" ? "Delivery completed" : "Delivery status updated",
              message: `Order #${orderId.toString()} delivery is now ${nextDeliveryStatus}.`,
              createdAt: updatedAt,
            })),
          });
        }
      }

      response.status(200).json({
        id: orderId.toString(),
        status,
        deliveryStatus: nextDeliveryStatus,
        deliveryPersonName,
        deliveryPersonPhone,
        updatedAt: updatedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  const router = Router();

  router.patch(
    "/:orderId/delivery",
    requireAuthentication,
    requireAdminAuthentication,
    updateDelivery,
  );

  return router;
}
