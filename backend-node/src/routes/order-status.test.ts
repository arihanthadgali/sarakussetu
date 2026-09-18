import type { PrismaClient } from "@prisma/client";

import {
  isOrderStatus,
  transitionOrderStatus,
  type OrderStatus,
} from "../order/orderStatus.js";

type Database = Pick<PrismaClient, "order">;

type UpdateOrderStatusResult =
  | { type: "not_found" }
  | { type: "invalid_status" }
  | { type: "invalid_current_status"; status: string }
  | { type: "invalid_transition"; message: string }
  | {
      type: "success";
      id: bigint;
      status: OrderStatus;
      updatedAt: Date;
    };

type CancelOrderResult =
  | { type: "not_found" }
  | { type: "invalid_status"; status: string }
  | { type: "invalid_transition"; message: string }
  | { type: "success"; id: bigint; status: "CANCELLED" };

export function createOrderStatusService({
  database,
}: {
  database: Database;
}) {
  const updateOrderStatus = async (
    customerId: bigint,
    orderId: bigint,
    targetStatus: string,
  ): Promise<UpdateOrderStatusResult> => {
    if (!isOrderStatus(targetStatus)) {
      return { type: "invalid_status" };
    }

    const order = await database.order.findFirst({
      where: {
        id: orderId,
        customerId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (order === null) {
      return { type: "not_found" };
    }

    if (!isOrderStatus(order.status)) {
      return {
        type: "invalid_current_status",
        status: order.status,
      };
    }

    let status: OrderStatus;

    try {
      status = transitionOrderStatus(
        order.status,
        targetStatus,
      );
    } catch (error) {
      return {
        type: "invalid_transition",
        message:
          error instanceof Error
            ? error.message
            : "Invalid order status transition.",
      };
    }

    const updatedAt = new Date();

    const updateResult = await database.order.updateMany({
      where: {
        id: orderId,
        customerId,
      },
      data: {
        status,
        updatedAt,
      },
    });

    if (updateResult.count === 0) {
      return { type: "not_found" };
    }

    return {
      type: "success",
      id: order.id,
      status,
      updatedAt,
    };
  };

  const cancelOrder = async (
    customerId: bigint,
    orderId: bigint,
  ): Promise<CancelOrderResult> => {
    const order = await database.order.findFirst({
      where: {
        id: orderId,
        customerId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (order === null) {
      return { type: "not_found" };
    }

    if (!isOrderStatus(order.status)) {
      return {
        type: "invalid_status",
        status: order.status,
      };
    }

    if (
      order.status !== "PENDING" &&
      order.status !== "CONFIRMED"
    ) {
      return {
        type: "invalid_transition",
        message: `Invalid order status transition: ${order.status} -> CANCELLED`,
      };
    }

    const updatedAt = new Date();

    const updateResult = await database.order.updateMany({
      where: {
        id: orderId,
        customerId,
      },
      data: {
        status: "CANCELLED",
        updatedAt,
      },
    });

    if (updateResult.count === 0) {
      return { type: "not_found" };
    }

    return {
      type: "success",
      id: order.id,
      status: "CANCELLED",
    };
  };

  return {
    updateOrderStatus,
    cancelOrder,
  };
}