import { Decimal } from "@prisma/client/runtime/library";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../middleware/authentication.js";
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
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
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

const getOrderDetailsHandler = (
  database: ReturnType<typeof createDatabase>["database"],
) => {
  const router = createOrdersRouter({
    database: database as never,
    requireAuthentication,
  });

  const route = router.stack.find(
    (layer) => layer.route?.path === "/:orderId",
  );

  if (route?.route === undefined) {
    throw new Error("GET /:orderId route not found.");
  }

  const [authenticationHandler, orderDetailsHandler] = route.route.stack;

  if (authenticationHandler?.handle !== requireAuthentication) {
    throw new Error(
      "GET /:orderId route does not require authentication.",
    );
  }

  if (orderDetailsHandler?.handle === undefined) {
    throw new Error("GET /:orderId handler not found.");
  }

  return orderDetailsHandler.handle;
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

describe("GET /api/orders/:orderId handler", () => {
  it("rejects requests without authenticated customer context", async () => {
    const { database } = createDatabase();
    const response = createResponse();

    await getOrderDetailsHandler(database)(
      {
        params: { orderId: "21" },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.order.findFirst).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
  });

  it("rejects an invalid order ID", async () => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    await getOrderDetailsHandler(database)(
      {
        params: { orderId: "abc" },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.order.findFirst).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: "A valid order ID is required.",
    });
  });

  it("returns 404 when the order does not exist", async () => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    database.order.findFirst.mockResolvedValueOnce(null);

    await getOrderDetailsHandler(database)(
      {
        params: { orderId: "999" },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.order.findFirst).toHaveBeenCalledWith({
      where: {
        id: 999n,
        customerId: 3n,
      },
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

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      message: "Order not found.",
    });
  });

  it("returns 404 when the order belongs to another customer", async () => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    database.order.findFirst.mockResolvedValueOnce(null);

    await getOrderDetailsHandler(database)(
      {
        params: { orderId: "21" },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 21n,
          customerId: 3n,
        },
      }),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      message: "Order not found.",
    });
  });

  it("returns the requested order and its items", async () => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    const createdAt = new Date("2026-08-31T10:30:00.000Z");

    database.order.findFirst.mockResolvedValueOnce({
      id: 21n,
      status: "PENDING",
      subtotal: new Decimal("998.00"),
      createdAt,
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
    });

    await getOrderDetailsHandler(database)(
      {
        params: { orderId: "21" },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      id: "21",
      status: "PENDING",
      subtotal: 998,
      createdAt: "2026-08-31T10:30:00.000Z",
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

  it("preserves the stored order item snapshots", async () => {
    const { database } = createDatabase();
    const response = createResponse(3n);

    database.order.findFirst.mockResolvedValueOnce({
      id: 21n,
      status: "PENDING",
      subtotal: new Decimal("1051.50"),
      createdAt: new Date("2026-08-31T10:30:00.000Z"),
      items: [
        {
          id: 31n,
          productId: 12n,
          productName: "Milk Chocolate Box - Old Name",
          quantity: 2,
          unitPrice: new Decimal("525.75"),
          lineTotal: new Decimal("1051.50"),
        },
      ],
    });

    await getOrderDetailsHandler(database)(
      {
        params: { orderId: "21" },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            productId: 12,
            productName: "Milk Chocolate Box - Old Name",
            quantity: 2,
            unitPrice: 525.75,
            lineTotal: 1051.5,
          }),
        ],
      }),
    );
  });

  it("only queries the authenticated customer's order", async () => {
    const { database } = createDatabase();
    const response = createResponse(99n);

    database.order.findFirst.mockResolvedValueOnce(null);

    await getOrderDetailsHandler(database)(
      {
        params: { orderId: "21" },
      } as unknown as Request,
      response,
      vi.fn(),
    );

    expect(database.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 21n,
          customerId: 99n,
        },
      }),
    );
  });

  it("forwards database errors to the shared error handler", async () => {
    const { database } = createDatabase();

    const failure = new Error("database unavailable");

    database.order.findFirst.mockRejectedValueOnce(failure);

    const response = createResponse(3n);
    const next = vi.fn();

    await getOrderDetailsHandler(database)(
      {
        params: { orderId: "21" },
      } as unknown as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(failure);
  });
});