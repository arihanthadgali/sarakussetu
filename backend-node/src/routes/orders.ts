import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const MAX_INT = 2_147_483_647;

type Database = PrismaClient;

type CreateOrderResult = {
  id: bigint;
  status: string;
  subtotal: Decimal;
  items: Array<{
    id: bigint;
    productId: bigint;
    productName: string;
    quantity: number;
    unitPrice: Decimal;
    lineTotal: Decimal;
  }>;
};

const productSelection = {
  id: true,
  name: true,
  price: true,
};

function serializeDecimal(value: Decimal): number {
  return value.toNumber();
}

function serializeOrder(order: CreateOrderResult) {
  return {
    id: order.id.toString(),
    status: order.status,
    subtotal: serializeDecimal(order.subtotal),
    items: order.items.map((item) => ({
      id: item.id.toString(),
      productId: Number(item.productId),
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: serializeDecimal(item.unitPrice),
      lineTotal: serializeDecimal(item.lineTotal),
    })),
  };
}

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
  const createOrder = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    const customerId = response.locals.customerId as bigint | undefined;

    if (customerId === undefined) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const order = await database.$transaction(async (transaction) => {
        const cart = await transaction.cart.findUnique({
          where: { customerId },
          select: {
            id: true,
            items: {
              select: {
                id: true,
                quantity: true,
                product: {
                  select: productSelection,
                },
              },
            },
          },
        });

        if (cart === null || cart.items.length === 0) {
          const error = new Error("Cart is empty.");
          (error as Error & { statusCode?: number }).statusCode = 400;
          throw error;
        }

        for (const item of cart.items) {
          if (
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0 ||
            item.quantity > MAX_INT
          ) {
            const error = new Error("Cart contains an invalid quantity.");
            (error as Error & { statusCode?: number }).statusCode = 400;
            throw error;
          }
        }

        const now = new Date();

        let subtotal = new Decimal(0);

        const orderItems = cart.items.map((item) => {
          const unitPrice = item.product.price;
          const lineTotal = unitPrice.mul(item.quantity);

          subtotal = subtotal.add(lineTotal);

          return {
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice,
            lineTotal,
          };
        });

        const createdOrder = await transaction.order.create({
          data: {
            customerId,
            status: "PENDING",
            subtotal,
            createdAt: now,
            updatedAt: now,
            items: {
              create: orderItems.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
                createdAt: now,
                updatedAt: now,
              })),
            },
          },
          select: {
            id: true,
            status: true,
            subtotal: true,
            items: {
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

        await transaction.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return createdOrder;
      });

      response.status(201).json(serializeOrder(order));
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
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    const customerId = response.locals.customerId as bigint | undefined;

    if (customerId === undefined) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const orders = await database.order.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          subtotal: true,
          createdAt: true,
          items: {
            orderBy: { createdAt: "asc" },
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
          ...serializeOrder(order),
          createdAt: order.createdAt.toISOString(),
        })),
      );
    } catch (error) {
      next(error);
    }
  };

  const router = Router();

  router.post("/", requireAuthentication, createOrder);
  router.get("/", requireAuthentication, getOrders);

  return router;
}