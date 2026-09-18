import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import type { PrismaClient } from "@prisma/client";

import { createOrderService } from "../services/orders/order-service.js";
import { createOrderEditService } from "../services/orders/order-edit-service.js";
import { createOrderStatusService } from "../services/orders/order-status-service.js";

type Database = Pick<
  PrismaClient,
  "$transaction" | "order" | "cart" | "cartItem" | "product"
>;

export function createOrdersRouter({
  database,
  requireAuthentication,
}: {
  database: Database;
  requireAuthentication: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => unknown;
}) {
  const orderService = createOrderService({ database });
  const orderEditService = createOrderEditService({ database });
  const orderStatusService = createOrderStatusService({ database });

  const createOrder = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    const customerId = response.locals.customerId as bigint | undefined;

    if (customerId === undefined) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const order = await orderService.createOrder(customerId);

      response.status(201).json(order);
    } catch (error) {
      if (
        error instanceof Error &&
        "statusCode" in error &&
        error.statusCode === 400
      ) {
        response.status(400).json({ message: error.message });
        return;
      }

      next(error);
    }
  };

  const getOrders = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    const customerId = response.locals.customerId as bigint | undefined;

    if (customerId === undefined) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const orders = await orderService.getOrders(customerId);

      response.status(200).json(orders);
    } catch (error) {
      next(error);
    }
  };

  const getOrderDetails = async (
    request: Request<{ orderId: string }>,
    response: Response,
    next: NextFunction,
  ) => {
    const customerId = response.locals.customerId as bigint | undefined;

    if (customerId === undefined) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const orderId = parseOrderId(request.params.orderId);

      if (orderId === null) {
        response.status(400).json({ message: "Invalid order ID." });
        return;
      }

      const order = await orderService.getOrderDetails(
        customerId,
        orderId,
      );

      if (order === null) {
        response.status(404).json({ message: "Order not found." });
        return;
      }

      response.status(200).json(order);
    } catch (error) {
      next(error);
    }
  };

  const editOrder = async (
    request: Request<{ orderId: string }>,
    response: Response,
    next: NextFunction,
  ) => {
    const customerId = response.locals.customerId as bigint | undefined;

    if (customerId === undefined) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const orderId = parseOrderId(request.params.orderId);

      if (orderId === null) {
        response.status(400).json({ message: "Invalid order ID." });
        return;
      }

      const result = await orderEditService.editOrder(
        customerId,
        orderId,
      );

      if (result.type === "not_found") {
        response.status(404).json({ message: "Order not found." });
        return;
      }

      if (result.type === "not_editable") {
        response.status(409).json({
          message: `Order cannot be edited after it reaches ${result.status}.`,
        });
        return;
      }

      response.status(200).json({
        message: "Order moved back to cart for editing.",
        cartId: result.cartId.toString(),
      });
    } catch (error) {
      next(error);
    }
  };

  const updateOrderStatus = async (
    request: Request<
      { orderId: string },
      unknown,
      { status: string }
    >,
    response: Response,
    next: NextFunction,
  ) => {
    const customerId = response.locals.customerId as bigint | undefined;

    if (customerId === undefined) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const orderId = parseOrderId(request.params.orderId);

      if (orderId === null) {
        response.status(400).json({ message: "Invalid order ID." });
        return;
      }

      const result = await orderStatusService.updateOrderStatus(
        customerId,
        orderId,
        request.body?.status,
      );

      if (result.type === "not_found") {
        response.status(404).json({ message: "Order not found." });
        return;
      }

      if (result.type === "invalid_status") {
        response.status(400).json({ message: "Invalid order status." });
        return;
      }

      if (result.type === "invalid_current_status") {
        next(
          new Error(
            `Invalid current order status: ${result.status}`,
          ),
        );
        return;
      }

      if (result.type === "invalid_transition") {
        response.status(409).json({
          message: result.message,
        });
        return;
      }

      response.status(200).json({
        id: result.id.toString(),
        status: result.status,
        updatedAt: result.updatedAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  const cancelOrder = async (
    request: Request<{ orderId: string }>,
    response: Response,
    next: NextFunction,
  ) => {
    const customerId = response.locals.customerId as bigint | undefined;

    if (customerId === undefined) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const orderId = parseOrderId(request.params.orderId);

      if (orderId === null) {
        response.status(400).json({ message: "Invalid order ID." });
        return;
      }

      const result = await orderStatusService.cancelOrder(
        customerId,
        orderId,
      );

      if (result.type === "not_found") {
        response.status(404).json({ message: "Order not found." });
        return;
      }

      if (result.type === "invalid_status") {
        next(
          new Error(
            `Invalid current order status: ${result.status}`,
          ),
        );
        return;
      }

      if (result.type === "invalid_transition") {
        response.status(409).json({
          message: result.message,
        });
        return;
      }

      response.status(200).json({
        id: result.id.toString(),
        status: result.status,
      });
    } catch (error) {
      next(error);
    }
  };

  const router = Router();

  router.post("/", requireAuthentication, createOrder);

  router.get("/", requireAuthentication, getOrders);

  router.get(
    "/:orderId",
    requireAuthentication,
    getOrderDetails,
  );

  router.patch(
    "/:orderId/status",
    requireAuthentication,
    updateOrderStatus,
  );

  router.post(
    "/:orderId/edit",
    requireAuthentication,
    editOrder,
  );

  router.delete(
    "/:orderId",
    requireAuthentication,
    cancelOrder,
  );

  return router;
}

function parseOrderId(value: string): bigint | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}