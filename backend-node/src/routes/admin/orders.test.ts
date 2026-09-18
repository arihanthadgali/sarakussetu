import { Decimal } from "@prisma/client/runtime/library";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../../middleware/authentication.js";
import { createAdminOrdersRouter } from "./orders.js";

const createResponse = () => {
  const response = {
    locals: {
      role: "ADMIN",
    },
    json: vi.fn(),
    status: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response as unknown as Response;
};

const createDatabase = () => ({
  order: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  wholesaler: {
    findUnique: vi.fn(),
  },
});

const getRouteHandler = (
  database: ReturnType<typeof createDatabase>,
  path: string,
  method: "get" | "patch",
) => {
  const router = createAdminOrdersRouter({
    database: database as never,
  });

 const route = router.stack.find((layer) => {
  if (layer.route === undefined) {
    return false;
  }

  const methods = layer.route as typeof layer.route & {
    methods: Record<string, boolean>;
  };

  return (
    layer.route.path === path &&
    methods.methods[method] === true
  );
});

  if (route?.route === undefined) {
    throw new Error(
      `${method.toUpperCase()} ${path} route not found.`,
    );
  }

  const handlers = route.route.stack;

  const authenticationHandler = handlers[0];
  const authorizationHandler = handlers[1];
  const routeHandler = handlers[2];

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    authorizationHandler?.handle === undefined ||
    routeHandler?.handle === undefined
  ) {
    throw new Error(
      `${method.toUpperCase()} ${path} middleware is not configured correctly.`,
    );
  }

  return routeHandler.handle;
};

const createRequest = (
  orderId?: string,
  wholesalerId?: string,
) =>
  ({
    params:
      orderId === undefined
        ? {}
        : {
            orderId,
          },
    body:
      wholesalerId === undefined
        ? {}
        : {
            wholesalerId,
          },
  }) as unknown as Request;

describe("admin orders routes", () => {
  it("returns unassigned orders", async () => {
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

    const response = createResponse();
    const handler = getRouteHandler(
      database,
      "/unassigned",
      "get",
    );

    await handler(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(database.order.findMany).toHaveBeenCalledWith({
      where: {
        wholesalerId: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: expect.any(Object),
    });

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

  it("returns an empty list when there are no unassigned orders", async () => {
    const database = createDatabase();

    database.order.findMany.mockResolvedValue([]);

    const response = createResponse();
    const handler = getRouteHandler(
      database,
      "/unassigned",
      "get",
    );

    await handler(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([]);
  });

  it("assigns an unassigned order to a wholesaler", async () => {
    const database = createDatabase();

    database.wholesaler.findUnique.mockResolvedValue({
      id: 20n,
      businessName: "Hubli Wholesale",
    });

    database.order.updateMany.mockResolvedValue({
      count: 1,
    });

    database.order.findUnique.mockResolvedValue({
      id: 100n,
      status: "PENDING",
      wholesalerId: 20n,
      subtotal: new Decimal("250.00"),
      updatedAt: new Date("2026-09-11T02:00:00.000Z"),
    });

    const response = createResponse();
    const handler = getRouteHandler(
      database,
      "/:orderId/wholesaler",
      "patch",
    );

    await handler(
      createRequest("100", "20"),
      response,
      vi.fn(),
    );

    expect(database.wholesaler.findUnique).toHaveBeenCalledWith({
      where: {
        id: 20n,
      },
      select: {
        id: true,
        businessName: true,
      },
    });

    expect(database.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 100n,
        wholesalerId: null,
      },
      data: {
        wholesalerId: 20n,
        updatedAt: expect.any(Date),
      },
    });

    expect(response.status).toHaveBeenCalledWith(200);

    expect(response.json).toHaveBeenCalledWith({
      id: "100",
      status: "PENDING",
      wholesaler: {
        id: "20",
        businessName: "Hubli Wholesale",
      },
      subtotal: 250,
      updatedAt: "2026-09-11T02:00:00.000Z",
    });
  });

  it("returns 400 for an invalid order ID", async () => {
    const database = createDatabase();

    const response = createResponse();
    const handler = getRouteHandler(
      database,
      "/:orderId/wholesaler",
      "patch",
    );

    await handler(
      createRequest("abc", "20"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(400);

    expect(response.json).toHaveBeenCalledWith({
      error: "Invalid order ID",
    });

    expect(database.wholesaler.findUnique).not.toHaveBeenCalled();
    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid wholesaler ID", async () => {
    const database = createDatabase();

    const response = createResponse();
    const handler = getRouteHandler(
      database,
      "/:orderId/wholesaler",
      "patch",
    );

    await handler(
      createRequest("100", "abc"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(400);

    expect(response.json).toHaveBeenCalledWith({
      error: "Invalid wholesaler ID",
    });

    expect(database.wholesaler.findUnique).not.toHaveBeenCalled();
    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the wholesaler does not exist", async () => {
    const database = createDatabase();

    database.wholesaler.findUnique.mockResolvedValue(null);

    const response = createResponse();
    const handler = getRouteHandler(
      database,
      "/:orderId/wholesaler",
      "patch",
    );

    await handler(
      createRequest("100", "999"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(404);

    expect(response.json).toHaveBeenCalledWith({
      error: "Wholesaler not found",
    });

    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the order does not exist", async () => {
    const database = createDatabase();

    database.wholesaler.findUnique.mockResolvedValue({
      id: 20n,
      businessName: "Hubli Wholesale",
    });

    database.order.updateMany.mockResolvedValue({
      count: 0,
    });

    database.order.findUnique.mockResolvedValue(null);

    const response = createResponse();
    const handler = getRouteHandler(
      database,
      "/:orderId/wholesaler",
      "patch",
    );

    await handler(
      createRequest("999", "20"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(404);

    expect(response.json).toHaveBeenCalledWith({
      error: "Order not found",
    });
  });

  it("returns 409 when the order is already assigned", async () => {
    const database = createDatabase();

    database.wholesaler.findUnique.mockResolvedValue({
      id: 20n,
      businessName: "Hubli Wholesale",
    });

    database.order.updateMany.mockResolvedValue({
      count: 0,
    });

    database.order.findUnique.mockResolvedValue({
      id: 100n,
      wholesalerId: 30n,
    });

    const response = createResponse();
    const handler = getRouteHandler(
      database,
      "/:orderId/wholesaler",
      "patch",
    );

    await handler(
      createRequest("100", "20"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(409);

    expect(response.json).toHaveBeenCalledWith({
      error: "Order is already assigned to a wholesaler",
    });
  });

  it("passes database errors to next", async () => {
    const database = createDatabase();
    const databaseError = new Error("Database failure");

    database.order.findMany.mockRejectedValue(databaseError);

    const response = createResponse();
    const next = vi.fn();
    const handler = getRouteHandler(
      database,
      "/unassigned",
      "get",
    );

    await handler(
      {} as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});