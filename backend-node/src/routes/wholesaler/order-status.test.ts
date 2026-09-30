import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../../middleware/authentication.js";
import { createWholesalerOrderStatusRouter } from "./order-status.js";

const createResponse = (
  role = "WHOLESALER",
  wholesalerId?: bigint,
) => {
  const response = {
    locals: {
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
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
});

const getUpdateOrderStatusHandler = (
  database: ReturnType<typeof createDatabase>,
) => {
  const router = createWholesalerOrderStatusRouter({
    database: database as never,
  });

  const route = router.stack.find(
    (layer) => layer.route?.path === "/:orderId/status",
  );

  if (route?.route === undefined) {
    throw new Error("PATCH /:orderId/status route not found.");
  }

  const handlers = route.route.stack;

  const authenticationHandler = handlers[0];
  const updateOrderStatusHandler = handlers[2];

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    updateOrderStatusHandler?.handle === undefined
  ) {
    throw new Error(
      "PATCH /:orderId/status route middleware is not configured correctly.",
    );
  }

  return updateOrderStatusHandler.handle;
};

const createRequest = (
  orderId: string,
  status: string,
) =>
  ({
    params: { orderId },
    body: { status },
  }) as unknown as Request;

describe("wholesaler order status routes", () => {
  it("creates one admin notification when an owned processing order becomes ready", async () => {
    const database = createDatabase();
    const admin = { findMany: vi.fn().mockResolvedValue([{ id: 1n }]) };
    const notification = { createMany: vi.fn().mockResolvedValue({ count: 1 }) };
    Object.assign(database, { admin, notification });
    database.order.findFirst.mockResolvedValue({ id: 100n, status: "PROCESSING" });
    database.order.updateMany.mockResolvedValue({ count: 1 });

    const response = createResponse("WHOLESALER", 20n);
    const handler = getUpdateOrderStatusHandler(database);
    await handler(createRequest("100", "READY"), response, vi.fn());

    expect(notification.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ adminId: 1n, title: "Order ready for delivery", message: "Order #100 is ready for delivery." })],
    });
  });
  it("confirms a pending order assigned to the wholesaler", async () => {
    const database = createDatabase();

    database.order.findFirst.mockResolvedValue({
      id: 100n,
      status: "PENDING",
    });

    database.order.updateMany.mockResolvedValue({
      count: 1,
    });

    const response = createResponse("WHOLESALER", 20n);
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("100", "CONFIRMED"),
      response,
      vi.fn(),
    );

    expect(database.order.findFirst).toHaveBeenCalledWith({
      where: {
        id: 100n,
        wholesalerId: 20n,
      },
      select: {
        id: true,
        status: true,
      },
    });

    expect(database.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 100n,
        wholesalerId: 20n,
      },
      data: {
        status: "CONFIRMED",
        updatedAt: expect.any(Date),
      },
    });

    expect(response.status).toHaveBeenCalledWith(200);

expect(response.json).toHaveBeenCalledWith(
  expect.objectContaining({
    id: "100",
    status: "CONFIRMED",
    updatedAt: expect.any(String),
  }),
);
  });

  it("moves a confirmed order to processing", async () => {
    const database = createDatabase();

    database.order.findFirst.mockResolvedValue({
      id: 100n,
      status: "CONFIRMED",
    });

    database.order.updateMany.mockResolvedValue({
      count: 1,
    });

    const response = createResponse("WHOLESALER", 20n);
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("100", "PROCESSING"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "100",
        status: "PROCESSING",
        updatedAt: expect.any(String),
      }),
    );

    expect(database.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 100n,
        wholesalerId: 20n,
      },
      data: {
        status: "PROCESSING",
        updatedAt: expect.any(Date),
      },
    });
  });

  it("allows an admin to update an order", async () => {
    const database = createDatabase();

    database.order.findUnique.mockResolvedValue({
      id: 100n,
      status: "PENDING",
    });

    database.order.updateMany.mockResolvedValue({
      count: 1,
    });

    const response = createResponse("ADMIN");
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("100", "CONFIRMED"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);

    expect(database.order.findUnique).toHaveBeenCalledWith({
      where: {
        id: 100n,
      },
      select: {
        id: true,
        status: true,
      },
    });

    expect(database.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 100n,
      },
      data: {
        status: "CONFIRMED",
        updatedAt: expect.any(Date),
      },
    });
  });

  it("returns 404 when the order does not exist", async () => {
    const database = createDatabase();

    database.order.findFirst.mockResolvedValue(null);

    const response = createResponse("WHOLESALER", 20n);
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("999", "CONFIRMED"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      error: "Order not found",
    });

    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the order belongs to another wholesaler", async () => {
    const database = createDatabase();

    database.order.findFirst.mockResolvedValue(null);

    const response = createResponse("WHOLESALER", 20n);
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("100", "CONFIRMED"),
      response,
      vi.fn(),
    );

    expect(database.order.findFirst).toHaveBeenCalledWith({
      where: {
        id: 100n,
        wholesalerId: 20n,
      },
      select: {
        id: true,
        status: true,
      },
    });

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      error: "Order not found",
    });

    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when the order is unassigned", async () => {
    const database = createDatabase();

    database.order.findFirst.mockResolvedValue(null);

    const response = createResponse("WHOLESALER", 20n);
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("100", "CONFIRMED"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      error: "Order not found",
    });

    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("returns 401 when the wholesaler id is missing", async () => {
    const database = createDatabase();

    const response = createResponse("WHOLESALER");
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("100", "CONFIRMED"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });

    expect(database.order.findFirst).not.toHaveBeenCalled();
    expect(database.order.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid order ID", async () => {
    const database = createDatabase();

    const response = createResponse("WHOLESALER", 20n);
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("abc", "CONFIRMED"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: "Invalid order ID",
    });

    expect(database.order.findFirst).not.toHaveBeenCalled();
    expect(database.order.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid status", async () => {
    const database = createDatabase();

    const response = createResponse("WHOLESALER", 20n);
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("100", "INVALID_STATUS"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: "Invalid order status",
    });

    expect(database.order.findFirst).not.toHaveBeenCalled();
    expect(database.order.findUnique).not.toHaveBeenCalled();
  });

  it("returns 409 for an invalid status transition", async () => {
    const database = createDatabase();

    database.order.findFirst.mockResolvedValue({
      id: 100n,
      status: "PROCESSING",
    });

    const response = createResponse("WHOLESALER", 20n);
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("100", "CONFIRMED"),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      error: "Invalid order status transition: PROCESSING -> CONFIRMED",
    });

    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("passes database errors to next", async () => {
    const database = createDatabase();
    const databaseError = new Error("Database failure");

    database.order.findFirst.mockRejectedValue(databaseError);

    const response = createResponse("WHOLESALER", 20n);
    const next = vi.fn();
    const handler = getUpdateOrderStatusHandler(database);

    await handler(
      createRequest("100", "CONFIRMED"),
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});
