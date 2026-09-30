import type { PrismaClient } from "@prisma/client";
import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import { requireAuthentication } from "../../middleware/authentication.js";
import { requireRole } from "../../middleware/authorization.js";
import {
  isOrderStatus,
  transitionOrderStatus,
} from "../../order/orderStatus.js";

type Database = Pick<PrismaClient, "order"> &
  Partial<Pick<PrismaClient, "admin" | "notification">>;

export function createWholesalerOrderStatusRouter({
  database,
}: {
  database: Database;
}) {
  const updateOrderStatus = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const orderIdValue = request.params.orderId;
      const statusValue = request.body?.status;
      const role = response.locals.role;
      const wholesalerId = response.locals.wholesalerId as
        | bigint
        | undefined;

      if (
        typeof orderIdValue !== "string" ||
        !/^\d+$/.test(orderIdValue)
      ) {
        response.status(400).json({
          error: "Invalid order ID",
        });
        return;
      }

      if (!isOrderStatus(statusValue)) {
        response.status(400).json({
          error: "Invalid order status",
        });
        return;
      }

      if (role === "WHOLESALER" && wholesalerId === undefined) {
        response.status(401).json({
          error: "Unauthorized",
        });
        return;
      }

      const orderId = BigInt(orderIdValue);

      const order =
        role === "WHOLESALER"
          ? await database.order.findFirst({
              where: {
                id: orderId,
                wholesalerId,
              },
              select: {
                id: true,
                status: true,
              },
            })
          : await database.order.findUnique({
              where: {
                id: orderId,
              },
              select: {
                id: true,
                status: true,
              },
            });

      if (order === null) {
        response.status(404).json({
          error: "Order not found",
        });
        return;
      }

      if (!isOrderStatus(order.status)) {
        next(
          new Error(
            `Invalid current order status: ${order.status}`,
          ),
        );
        return;
      }

      let status;

      try {
        status = transitionOrderStatus(
          order.status,
          statusValue,
        );
      } catch (error) {
        response.status(409).json({
          error:
            error instanceof Error
              ? error.message
              : "Invalid order status transition",
        });
        return;
      }

      const updatedAt = new Date();

      const updateResult =
        role === "WHOLESALER"
          ? await database.order.updateMany({
              where: {
                id: order.id,
                wholesalerId,
              },
              data: {
                status,
                updatedAt,
              },
            })
          : await database.order.updateMany({
              where: {
                id: order.id,
              },
              data: {
                status,
                updatedAt,
              },
            });

      if (updateResult.count === 0) {
        response.status(404).json({
          error: "Order not found",
        });
        return;
      }

      if (
        status === "READY" &&
        database.admin !== undefined &&
        database.notification !== undefined
      ) {
        const admins = await database.admin.findMany({
          select: { id: true },
        });
        if (admins.length > 0) {
          await database.notification.createMany({
            data: admins.map((admin) => ({
              adminId: admin.id,
              title: "Order ready for delivery",
              message: `Order #${order.id.toString()} is ready for delivery.`,
              createdAt: updatedAt,
            })),
          });
        }
      }

      response.status(200).json({
        id: order.id.toString(),
        status,
        updatedAt: updatedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  const router = Router();

  router.patch(
    "/:orderId/status",
    requireAuthentication,
    requireRole("WHOLESALER"),
    updateOrderStatus,
  );

  return router;
}
