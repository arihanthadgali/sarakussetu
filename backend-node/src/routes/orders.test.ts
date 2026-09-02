import { Decimal } from "@prisma/client/runtime/library";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../middleware/authentication.js";
import { ORDER_STATUSES } from "../order/orderStatus.js";
import { createOrdersRouter } from "./orders.js";

const product = {
  id: 12n,
  name: "Milk Chocolate Box",
  price: new Decimal("499.00"),
};

const createResponse = (customerId?: bigint) => {
  const response = {
    locals: customerId === undefined ? {} : { customerId },
    json: vi.fn(),
    status: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response as unknown as Response;
};

const createDatabase = () => {
  const transaction = {
    cart: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    order: {
      create: vi.fn().mockResolvedValue({
        id: 21n,
        status: "PENDING",
        subtotal: new Decimal("998.00"),
        items: [
          {
            id: 31n,
            productId: 12n,
            productName: "Milk Chocolate Box",
            quantity: 2,
            unitPrice: new Decimal("499.00"),
            lineTotal: new Decimal("998.00"),
          },
        ],
      }),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    cartItem: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };

  const database = {
    $transaction: vi.fn(
      async (
        callback: (client: typeof transaction) => unknown,
      ) => callback(transaction),
    ),
    order: {
      findMany: transaction.order.findMany,
      findFirst: transaction.order.findFirst,
      updateMany: transaction.order.updateMany,
    },
  };

  return { database, transaction };
};

const getCreateOrderHandler = (
  database: ReturnType<typeof createDatabase>["database"],
) => {
  const router = createOrdersRouter({
    database: database as never,
    requireAuthentication,
  });

  const route = router.stack.find((layer) => layer.route?.path === "/");

  if (route?.route === undefined) {
    throw new Error("POST / route not found.");
  }

  const [authenticationHandler, createOrderHandler] = route.route.stack;

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    createOrderHandler?.handle === undefined
  ) {
    throw new Error("POST / route does not require authentication.");
  }

  return createOrderHandler.handle;
};

const getOrdersHandler = (
  database: ReturnType<typeof createDatabase>["database"],
) => {
  const router = createOrdersRouter({
    database: database as never,
    requireAuthentication,
  });

  const route = router.stack.filter((layer) => layer.route?.path === "/")[1];

  if (route?.route === undefined) {
    throw new Error("GET / route not found.");
  }

  const [authenticationHandler, getOrdersHandler] = route.route.stack;

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    getOrdersHandler?.handle === undefined
  ) {
    throw new Error("GET / route does not require authentication.");
  }

  return getOrdersHandler.handle;
};

const getCancelOrderHandler = (
  database: ReturnType<typeof createDatabase>["database"],
) => {
  const router = createOrdersRouter({
    database: database as never,
    requireAuthentication,
  });

  const route = router.stack.find((layer) => layer.route?.path === "/:orderId");

  if (route?.route === undefined) {
    throw new Error("DELETE /:orderId route not found.");
  }

  const [authenticationHandler, cancelOrderHandler] = route.route.stack;

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    cancelOrderHandler?.handle === undefined
  ) {
    throw new Error("DELETE /:orderId does not require authentication.");
  }

  return cancelOrderHandler.handle;
};

describe("POST /api/orders handler", () => {
  it("rejects requests without authenticated customer context", async () => {
    const { database } = createDatabase();
    const response = createResponse();

    await getCreateOrderHandler(database)(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(database.$transaction).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
  });

  it("rejects an authenticated customer with no cart", async () => {
    const { database, transaction } = createDatabase();
    const response = createResponse(3n);

    await getCreateOrderHandler(database)(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(transaction.cart.findUnique).toHaveBeenCalledWith({
      where: { customerId: 3n },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    expect(transaction.order.create).not.toHaveBeenCalled();
    expect(transaction.cartItem.deleteMany).not.toHaveBeenCalled();

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: "Cart is empty.",
    });
  });

  it("rejects an authenticated customer with an empty cart", async () => {
    const { database, transaction } = createDatabase();

    transaction.cart.findUnique.mockResolvedValueOnce({
      id: 9n,
      items: [],
    });

    const response = createResponse(3n);

    await getCreateOrderHandler(database)(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(transaction.order.create).not.toHaveBeenCalled();
    expect(transaction.cartItem.deleteMany).not.toHaveBeenCalled();

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: "Cart is empty.",
    });
  });

  it("creates an order from the authenticated customer's cart", async () => {
    const { database, transaction } = createDatabase();

    transaction.cart.findUnique.mockResolvedValueOnce({
      id: 9n,
      items: [
        {
          id: 17n,
          quantity: 2,
          product,
        },
      ],
    });

    const response = createResponse(3n);

    await getCreateOrderHandler(database)(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(database.$transaction).toHaveBeenCalledTimes(1);

    expect(transaction.order.create).toHaveBeenCalledWith({
      data: {
        customerId: 3n,
        status: "PENDING",
        subtotal: new Decimal("998"),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        items: {
          create: [
            {
              productId: 12n,
              productName: "Milk Chocolate Box",
              quantity: 2,
              unitPrice: new Decimal("499.00"),
              lineTotal: new Decimal("998"),
              createdAt: expect.any(Date),
              updatedAt: expect.any(Date),
            },
          ],
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

    expect(transaction.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 9n },
    });

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
      id: "21",
      status: "PENDING",
      subtotal: 998,
      items: [
        {
          id: "31",
          productId: 12,
          productName: "Milk Chocolate Box",
          quantity: 2,
          unitPrice: 499,
          lineTotal: 998,
        },
      ],
    });
  });

  it("calculates multiple order lines and the Decimal-safe subtotal", async () => {
    const { database, transaction } = createDatabase();

    transaction.cart.findUnique.mockResolvedValueOnce({
      id: 9n,
      items: [
        {
          id: 17n,
          quantity: 2,
          product: {
            id: 12n,
            name: "Milk Chocolate Box",
            price: new Decimal("499.99"),
          },
        },
        {
          id: 18n,
          quantity: 3,
          product: {
            id: 13n,
            name: "Dark Chocolate Box",
            price: new Decimal("599.50"),
          },
        },
      ],
    });

    transaction.order.create.mockResolvedValueOnce({
      id: 22n,
      status: "PENDING",
      subtotal: new Decimal("2798.98"),
      items: [
        {
          id: 32n,
          productId: 12n,
          productName: "Milk Chocolate Box",
          quantity: 2,
          unitPrice: new Decimal("499.99"),
          lineTotal: new Decimal("999.98"),
        },
        {
          id: 33n,
          productId: 13n,
          productName: "Dark Chocolate Box",
          quantity: 3,
          unitPrice: new Decimal("599.50"),
          lineTotal: new Decimal("1798.50"),
        },
      ],
    });

    const response = createResponse(3n);

    await getCreateOrderHandler(database)(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: new Decimal("2798.48"),
          items: {
            create: [
              expect.objectContaining({
                productId: 12n,
                quantity: 2,
                unitPrice: new Decimal("499.99"),
                lineTotal: new Decimal("999.98"),
              }),
              expect.objectContaining({
                productId: 13n,
                quantity: 3,
                unitPrice: new Decimal("599.50"),
                lineTotal: new Decimal("1798.50"),
              }),
            ],
          },
        }),
      }),
    );
  });

  it("uses the current product price and stores it on the order item", async () => {
    const { database, transaction } = createDatabase();

    transaction.cart.findUnique.mockResolvedValueOnce({
      id: 9n,
      items: [
        {
          id: 17n,
          quantity: 4,
          product: {
            id: 12n,
            name: "Milk Chocolate Box",
            price: new Decimal("525.75"),
          },
        },
      ],
    });

    const response = createResponse(3n);

    await getCreateOrderHandler(database)(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: new Decimal("2103.00"),
          items: {
            create: [
              expect.objectContaining({
                productId: 12n,
                productName: "Milk Chocolate Box",
                quantity: 4,
                unitPrice: new Decimal("525.75"),
                lineTotal: new Decimal("2103.00"),
              }),
            ],
          },
        }),
      }),
    );
  });

  it("only reads the cart belonging to the authenticated customer", async () => {
    const { database, transaction } = createDatabase();

    transaction.cart.findUnique.mockResolvedValueOnce({
      id: 15n,
      items: [
        {
          id: 40n,
          quantity: 1,
          product,
        },
      ],
    });

    const response = createResponse(99n);

    await getCreateOrderHandler(database)(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(transaction.cart.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: 99n },
      }),
    );

    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 99n,
        }),
      }),
    );
  });

  it("clears the customer's cart only after creating the order", async () => {
    const { database, transaction } = createDatabase();

    transaction.cart.findUnique.mockResolvedValueOnce({
      id: 9n,
      items: [
        {
          id: 17n,
          quantity: 2,
          product,
        },
      ],
    });

    const response = createResponse(3n);

    await getCreateOrderHandler(database)(
      {} as Request,
      response,
      vi.fn(),
    );

    const createOrderCall =
  transaction.order.create.mock.invocationCallOrder[0];

    const deleteCartCall =
  transaction.cartItem.deleteMany.mock.invocationCallOrder[0];

    expect(createOrderCall).toBeDefined();
    expect(deleteCartCall).toBeDefined();
    expect(createOrderCall!).toBeLessThan(deleteCartCall!);
  });

  it("forwards database errors to the shared error handler", async () => {
    const { database, transaction } = createDatabase();

    const failure = new Error("database unavailable");

    transaction.cart.findUnique.mockRejectedValueOnce(failure);

    const response = createResponse(3n);
    const next = vi.fn();

    await getCreateOrderHandler(database)(
      {} as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(failure);
  });
});

describe("GET /api/orders handler", () => {
  it("rejects unauthenticated requests without querying orders", async () => {
    const { database, transaction } = createDatabase();
    const response = createResponse();

    await getOrdersHandler(database)({} as Request, response, vi.fn());

    expect(transaction.order.findMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("returns the authenticated customer's orders with their current statuses and existing fields", async () => {
    const { database, transaction } = createDatabase();
    const createdAt = new Date("2026-09-02T10:30:00.000Z");

    transaction.order.findMany.mockResolvedValueOnce([
      {
        id: 41n,
        status: ORDER_STATUSES[3],
        subtotal: new Decimal("998.00"),
        createdAt,
        items: [
          {
            id: 51n,
            productId: 12n,
            productName: "Milk Chocolate Box",
            quantity: 2,
            unitPrice: new Decimal("499.00"),
            lineTotal: new Decimal("998.00"),
          },
        ],
      },
      {
        id: 42n,
        status: ORDER_STATUSES[5],
        subtotal: new Decimal("250.50"),
        createdAt: new Date("2026-09-01T10:30:00.000Z"),
        items: [],
      },
    ]);

    const response = createResponse(7n);
    await getOrdersHandler(database)({} as Request, response, vi.fn());

    expect(transaction.order.findMany).toHaveBeenCalledWith({
      where: { customerId: 7n },
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

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      {
        id: "41",
        status: ORDER_STATUSES[3],
        subtotal: 998,
        createdAt: createdAt.toISOString(),
        items: [{ id: "51", productId: 12, productName: "Milk Chocolate Box", quantity: 2, unitPrice: 499, lineTotal: 998 }],
      },
      {
        id: "42",
        status: ORDER_STATUSES[5],
        subtotal: 250.5,
        createdAt: "2026-09-01T10:30:00.000Z",
        items: [],
      },
    ]);
  });

  it("returns an empty list successfully for an authenticated customer", async () => {
    const { database, transaction } = createDatabase();
    const response = createResponse(8n);

    await getOrdersHandler(database)({} as Request, response, vi.fn());

    expect(transaction.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerId: 8n } }),
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([]);
  });
});

describe("DELETE /api/orders/:orderId handler", () => {
  const orderId = 70n;
  const requestFor = (id = orderId.toString()) =>
    ({ params: { orderId: id } }) as unknown as Request;

  it("rejects unauthenticated cancellation without querying orders", async () => {
    const { database, transaction } = createDatabase();
    const response = createResponse();

    await getCancelOrderHandler(database)(requestFor(), response, vi.fn());

    expect(transaction.order.findFirst).not.toHaveBeenCalled();
    expect(transaction.order.updateMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("rejects malformed order IDs without querying orders", async () => {
    const { database, transaction } = createDatabase();
    const response = createResponse(7n);

    await getCancelOrderHandler(database)(requestFor("not-an-id"), response, vi.fn());

    expect(transaction.order.findFirst).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ message: "Invalid order ID." });
  });

  it.each([ORDER_STATUSES[0], ORDER_STATUSES[1]])(
    "cancels an owned %s order and preserves its history",
    async (currentStatus) => {
      const { database, transaction } = createDatabase();
      transaction.order.findFirst.mockResolvedValueOnce({ id: orderId, status: currentStatus });
      const response = createResponse(7n);

      await getCancelOrderHandler(database)(requestFor(), response, vi.fn());

      expect(transaction.order.findFirst).toHaveBeenCalledWith({
        where: { id: orderId, customerId: 7n },
        select: { id: true, status: true },
      });
      expect(transaction.order.updateMany).toHaveBeenCalledWith({
        where: { id: orderId, customerId: 7n },
        data: { status: ORDER_STATUSES[5], updatedAt: expect.any(Date) },
      });
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({ id: orderId.toString(), status: ORDER_STATUSES[5] });
    },
  );

  it.each([ORDER_STATUSES[2], ORDER_STATUSES[3], ORDER_STATUSES[4], ORDER_STATUSES[5]])(
    "rejects cancellation of a %s order",
    async (currentStatus) => {
      const { database, transaction } = createDatabase();
      transaction.order.findFirst.mockResolvedValueOnce({ id: orderId, status: currentStatus });
      const response = createResponse(7n);

      await getCancelOrderHandler(database)(requestFor(), response, vi.fn());

      expect(transaction.order.updateMany).not.toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(409);
      expect(response.json).toHaveBeenCalledWith({
        message: `Invalid order status transition: ${currentStatus} -> ${ORDER_STATUSES[5]}`,
      });
    },
  );

  it("does not reveal or cancel another customer's order", async () => {
    const { database, transaction } = createDatabase();
    const response = createResponse(7n);

    await getCancelOrderHandler(database)(requestFor(), response, vi.fn());

    expect(transaction.order.findFirst).toHaveBeenCalledWith({
      where: { id: orderId, customerId: 7n },
      select: { id: true, status: true },
    });
    expect(transaction.order.updateMany).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: "Order not found." });
  });

  it("passes unexpected database errors to the shared error handler", async () => {
    const { database, transaction } = createDatabase();
    const failure = new Error("database unavailable");
    transaction.order.findFirst.mockRejectedValueOnce(failure);
    const response = createResponse(7n);
    const next = vi.fn();

    await getCancelOrderHandler(database)(requestFor(), response, next);

    expect(next).toHaveBeenCalledWith(failure);
  });
});
