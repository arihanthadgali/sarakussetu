import type { PrismaClient } from "@prisma/client";

type Database = Pick<PrismaClient, "order" | "wholesaler"> &
  Partial<Pick<PrismaClient, "notification">>;

const orderSelection = {
  id: true,
  status: true,
  deliveryStatus: true,
  deliveryPersonName: true,
  deliveryPersonPhone: true,
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
      createdAt: "asc" as const,
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
};

export function createOrderAssignmentService({
  database,
}: {
  database: Database;
}) {
  const getUnassignedOrders = async () => {
    return database.order.findMany({
      where: {
        wholesalerId: null,
      },
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
  };

  const getOrders = async () => {
    return database.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: orderSelection,
    });
  };

  const getWholesalers = async () => {
    return database.wholesaler.findMany({
      orderBy: {
        businessName: "asc",
      },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        phoneNumber: true,
        city: true,
        pincode: true,
      },
    });
  };

  const assignOrder = async (
    orderId: bigint,
    wholesalerId: bigint,
  ) => {
    const wholesaler = await database.wholesaler.findUnique({
      where: {
        id: wholesalerId,
      },
      select: {
        id: true,
        businessName: true,
      },
    });

    if (wholesaler === null) {
      return {
        type: "wholesaler_not_found" as const,
      };
    }

    const result = await database.order.updateMany({
      where: {
        id: orderId,
      },
      data: {
        wholesalerId,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return {
        type: "order_not_found" as const,
      };
    }

    const updatedOrder = await database.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        status: true,
        wholesalerId: true,
        subtotal: true,
        updatedAt: true,
      },
    });

    if (updatedOrder === null) {
      throw new Error("Order disappeared after assignment.");
    }

    if (database.notification !== undefined) {
      await database.notification.create({
        data: {
          wholesalerId,
          title: "New order assigned",
          message: `Order #${orderId.toString()} has been assigned to your business.`,
          createdAt: new Date(),
        },
      });
    }

    return {
      type: "assigned" as const,
      order: updatedOrder,
      wholesaler,
    };
  };

  return {
    getUnassignedOrders,
    getOrders,
    getWholesalers,
    assignOrder,
  };
}
