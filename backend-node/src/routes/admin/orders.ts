import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { requireAuthentication } from "../../middleware/authentication.js";
//import { requireRole } from "../../middleware/authorization.js";
import { createOrderAssignmentService } from "../../services/admin/order-assignment-service.js";
import { requireAdminAuthentication } from "../../middleware/admin-authentication.js";

type Database = Parameters<
  typeof createOrderAssignmentService
>[0]["database"];

export function createAdminOrdersRouter({
  database,
}: {
  database: Database;
}) {
  const assignmentService = createOrderAssignmentService({
    database,
  });

  const getUnassignedOrders = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const orders =
        await assignmentService.getUnassignedOrders();

      response.status(200).json(
        orders.map((order) => ({
          id: order.id.toString(),
          status: order.status,
          subtotal: order.subtotal.toNumber(),
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          retailer: {
            id: order.customer.id.toString(),
            phoneNumber: order.customer.phoneNumber,
          },
          items: order.items.map((item) => ({
            id: item.id.toString(),
            productId: Number(item.productId),
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toNumber(),
            lineTotal: item.lineTotal.toNumber(),
          })),
        })),
      );
    } catch (error) {
      next(error);
    }
  };

  const assignWholesaler = async (
    request: Request<{ orderId: string }>,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const orderIdValue = request.params.orderId;
      const wholesalerIdValue = request.body?.wholesalerId;

      if (
        typeof orderIdValue !== "string" ||
        !/^\d+$/.test(orderIdValue)
      ) {
        response.status(400).json({
          error: "Invalid order ID",
        });
        return;
      }

      if (
        typeof wholesalerIdValue !== "string" ||
        !/^\d+$/.test(wholesalerIdValue)
      ) {
        response.status(400).json({
          error: "Invalid wholesaler ID",
        });
        return;
      }

      const result = await assignmentService.assignOrder(
        BigInt(orderIdValue),
        BigInt(wholesalerIdValue),
      );

      if (result.type === "order_not_found") {
        response.status(404).json({
          error: "Order not found",
        });
        return;
      }

      if (result.type === "wholesaler_not_found") {
        response.status(404).json({
          error: "Wholesaler not found",
        });
        return;
      }

      if (result.type === "already_assigned") {
        response.status(409).json({
          error: "Order is already assigned to a wholesaler",
        });
        return;
      }

      response.status(200).json({
        id: result.order.id.toString(),
        status: result.order.status,
        wholesaler: {
          id: result.wholesaler.id.toString(),
          businessName: result.wholesaler.businessName,
        },
        subtotal: result.order.subtotal.toNumber(),
        updatedAt: result.order.updatedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  const router = Router();

  router.get(
    "/unassigned",
    requireAuthentication,
    requireAdminAuthentication,
    getUnassignedOrders,
  );

  router.patch(
    "/:orderId/wholesaler",
    requireAuthentication,
    requireAdminAuthentication,
    assignWholesaler,
  );

  return router;
}