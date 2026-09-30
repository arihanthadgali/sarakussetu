import type { PrismaClient } from "@prisma/client";

type Database = Pick<
  PrismaClient,
  "$transaction" | "order" | "cart" | "cartItem" | "product"
>;

type EditOrderResult =
  | {
      type: "not_found";
    }
  | {
      type: "not_editable";
      status: string;
    }
  | {
      type: "success";
      cartId: bigint;
    };

export function createOrderEditService({
  database,
}: {
  database: Database;
}) {
  const editOrder = async (
    customerId: bigint,
    orderId: bigint,
  ): Promise<EditOrderResult> => {
    return database.$transaction(async (transaction) => {
      const order = await transaction.order.findFirst({
        where: {
          id: orderId,
          customerId,
        },
        select: {
          id: true,
          status: true,
          items: {
            select: {
              productId: true,
              quantity: true,
            },
          },
        },
      });

      if (order === null) {
        return { type: "not_found" };
      }

      if (
        order.status !== "PENDING" &&
        order.status !== "CONFIRMED"
      ) {
        return {
          type: "not_editable",
          status: order.status,
        };
      }

      const now = new Date();

      let cart = await transaction.cart.findUnique({
        where: { customerId },
        select: { id: true },
      });

      if (cart === null) {
        cart = await transaction.cart.create({
          data: {
            customerId,
            createdAt: now,
            updatedAt: now,
          },
          select: { id: true },
        });
      }

      for (const item of order.items) {
        const product = await transaction.product.findFirst({
          where: {
            id: item.productId,
            active: true,
          },
          select: { id: true },
        });

        if (product === null) {
          throw new Error(
            "One or more products from this order are no longer available.",
          );
        }

        const existingItem = await transaction.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId: item.productId,
            },
          },
          select: {
            id: true,
            quantity: true,
          },
        });

        if (existingItem) {
          await transaction.cartItem.update({
            where: {
              id: existingItem.id,
            },
            data: {
              quantity: existingItem.quantity + item.quantity,
              updatedAt: now,
            },
          });
        } else {
          await transaction.cartItem.create({
            data: {
              cartId: cart.id,
              productId: item.productId,
              quantity: item.quantity,
              createdAt: now,
              updatedAt: now,
            },
          });
        }
      }

      await transaction.cart.update({
        where: { id: cart.id },
        data: {
          updatedAt: now,
        },
      });

      await transaction.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          updatedAt: now,
        },
      });

      return {
        type: "success",
        cartId: cart.id,
      };
    });
  };

  return {
    editOrder,
  };
}
