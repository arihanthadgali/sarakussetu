import { Decimal } from "@prisma/client/runtime/library";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../../middleware/authentication.js";
import { createWholesalerOrdersRouter } from "./orders.js";

const createResponse = (
  role?: string,
  wholesalerId?: bigint,
) => {
  const response = {
    locals:
      role === undefined
        ? {}
        : {
            role,
            ...(wholesalerId === undefined ? {} : { wholesalerId }),
          },
    json: vi.fn(),
    status: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response as unknown as Response;
};

const createDatabase = () => ({
  order: {
    findMany: vi.fn().mockResolvedValue([]),
  },
});

const getOrdersHandler = (
  database: ReturnType<typeof createDatabase>,
) => {
  const router = createWholesalerOrdersRouter({
    database: database as never,
  });

  const route = router.stack.find((layer) => layer.route?.path === "/");

  if (route?.route === undefined) {
    throw new Error("GET / route not found.");
  }

  const handlers = route.route.stack;

  const authenticationHandler = handlers[0];
  const getOrdersHandler = handlers[2];

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    getOrdersHandler?.handle === undefined
  ) {
    throw new Error("GET / route middleware is not configured correctly.");
  }

  return getOrdersHandler.handle;
};

describe("wholesaler orders routes", () => {
  it("returns all orders assigned to the current wholesaler", async () => {
    const database = createDatabase();

    database.order.findMany.mockResolvedValue([
      {
        id: 100n,
        status: "PENDING",
        subtotal: new Decimal("250.00"),
        createdAt: new Date("2026-09-11T01:00:00.000Z"),
        updatedAt: new Date("2026-09-11T01:05:00.000Z"),
        customer: {
          id: 5n,
          phoneNumber: "9876543210",
        },
        wholesaler: {
          id: 20n,
          businessName: "Hubli Wholesale",
        },
        items: [
          {
            id: 1n,
            productId: 101n,
            productName: "Tomato",
            quantity: 10,
            unitPrice: new Decimal("20.00"),
            lineTotal: new Decimal("200.00"),
          },
        ],
      },
    ]);

    const response = createResponse("WHOLESALER", 20n);
    const handler = getOrdersHandler(database);

    await handler(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);

    expect(response.json).toHaveBeenCalledWith([
      {
        id: "100",
        status: "PENDING",
        subtotal: 250,
        createdAt: "2026-09-11T01:00:00.000Z",
        updatedAt: "2026-09-11T01:05:00.000Z",

        retailer: {
          id: "5",
          phoneNumber: "9876543210",
        },

        wholesaler: {
          id: "20",
          businessName: "Hubli Wholesale",
        },

        items: [
          {
            id: "1",
            productId: 101,
            productName: "Tomato",
            quantity: 10,
            unitPrice: 20,
            lineTotal: 200,
          },
        ],
      },
    ]);
  });

  it("queries orders only for the current wholesaler", async () => {
    const database = createDatabase();
    const response = createResponse("WHOLESALER", 20n);
    const handler = getOrdersHandler(database);

    await handler(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(database.order.findMany).toHaveBeenCalledWith({
      where: {
        wholesalerId: 20n,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: expect.any(Object),
    });
  });

  it("supports an admin accessing all wholesaler orders", async () => {
    const database = createDatabase();
    const response = createResponse("ADMIN");
    const handler = getOrdersHandler(database);

    await handler(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);

    expect(database.order.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: {
        createdAt: "desc",
      },
      select: expect.any(Object),
    });
  });

  it("returns an empty list when the wholesaler has no assigned orders", async () => {
    const database = createDatabase();
    const response = createResponse("WHOLESALER", 20n);
    const handler = getOrdersHandler(database);

    await handler(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([]);
  });

  it("returns 401 when a wholesaler id is missing", async () => {
    const database = createDatabase();
    const response = createResponse("WHOLESALER");
    const next = vi.fn();
    const handler = getOrdersHandler(database);

    await handler(
      {} as Request,
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });

    expect(database.order.findMany).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("passes database errors to next", async () => {
    const database = createDatabase();
    const databaseError = new Error("Database failure");

    database.order.findMany.mockRejectedValue(databaseError);

    const response = createResponse("WHOLESALER", 20n);
    const next = vi.fn();
    const handler = getOrdersHandler(database);

    await handler(
      {} as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});