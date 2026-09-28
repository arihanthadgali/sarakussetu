import type { PrismaClient } from "@prisma/client";
import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import { requireRole } from "../../middleware/authorization.js";
import { requireAuthentication } from "../../middleware/authentication.js";


type Database = PrismaClient;

const serializeDecimal = (value: { toNumber(): number }): number =>
  value.toNumber();

export function createWholesalerOrdersRouter({
  database,
}: {
  database: Database;
}) {
  const getOrders = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const role = response.locals.role;
      const wholesalerId = response.locals.wholesalerId as bigint | undefined;

      if (role === "WHOLESALER" && wholesalerId === undefined) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      const orders = await database.order.findMany({
        where:
          role === "WHOLESALER"
            ? {
                wholesalerId,
              }
            : undefined,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          subtotal: true,
          createdAt: true,
          updatedAt: true,

          customer: {
            select: {
              id: true,
              phoneNumber: true,
            },
          },

          wholesaler: {
            select: {
              id: true,
              businessName: true,
            },
          },

          items: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              productId: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
            },
          },
        },
      });

      response.status(200).json(
        orders.map((order) => ({
          id: order.id.toString(),
          status: order.status,
          subtotal: serializeDecimal(order.subtotal),
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),

          retailer: {
            id: order.customer.id.toString(),
            phoneNumber: order.customer.phoneNumber,
          },

          wholesaler:
            order.wholesaler === null
              ? null
              : {
                  id: order.wholesaler.id.toString(),
                  businessName: order.wholesaler.businessName,
                },

          items: order.items.map((item) => ({
            id: item.id.toString(),
            productId: Number(item.productId),
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: serializeDecimal(item.unitPrice),
            lineTotal: serializeDecimal(item.lineTotal),
          })),
        })),
      );
    } catch (error) {
      next(error);
    }
  };

  const router = Router();

  router.get(
    "/",
    requireAuthentication,
    requireRole("WHOLESALER"),
    getOrders,
  );

  return router;
}