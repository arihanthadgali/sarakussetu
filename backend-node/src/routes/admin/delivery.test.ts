import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../../middleware/authentication.js";
import { createAdminDeliveryRouter } from "./delivery.js";

const createResponse = (adminId: bigint | null = 1n, role = "RETAILER") => {
  const response = {
    locals: adminId === null ? { role } : { role: "ADMIN", adminId },
    json: vi.fn(),
    status: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

const createDatabase = () => ({
  order: { findUnique: vi.fn(), updateMany: vi.fn() },
});

const getHandlers = (database: ReturnType<typeof createDatabase>) => {
  const router = createAdminDeliveryRouter({ database: database as never });
  const route = router.stack.find((layer) => layer.route?.path === "/:orderId/delivery");
  if (route?.route === undefined) throw new Error("PATCH delivery route not found.");
  const [authenticationHandler, authorizationHandler, deliveryHandler] = route.route.stack;
  if (authenticationHandler?.handle !== requireAuthentication || authorizationHandler?.handle === undefined || deliveryHandler?.handle === undefined) {
    throw new Error("PATCH delivery middleware is not configured correctly.");
  }
  return { authorizationHandler: authorizationHandler.handle, handler: deliveryHandler.handle };
};

const request = (body: Record<string, unknown>, orderId = "100") =>
  ({ params: { orderId }, body }) as unknown as Request;

const readyOrder = {
  id: 100n,
  status: "READY",
  deliveryStatus: "UNASSIGNED",
  deliveryPersonName: null,
  deliveryPersonPhone: null,
};

describe("admin delivery routes", () => {
  it("assigns a delivery person to a ready order", async () => {
    const database = createDatabase();
    database.order.findUnique.mockResolvedValue(readyOrder);
    database.order.updateMany.mockResolvedValue({ count: 1 });
    const response = createResponse();

    await getHandlers(database).handler(
      request({ status: "ASSIGNED", deliveryPersonName: "Asha", deliveryPersonPhone: "9876543210" }),
      response,
      vi.fn(),
    );

    expect(database.order.updateMany).toHaveBeenCalledWith({
      where: { id: 100n, status: "READY", deliveryStatus: "UNASSIGNED" },
      data: expect.objectContaining({
        status: "READY",
        deliveryStatus: "ASSIGNED",
        deliveryPersonName: "Asha",
        deliveryPersonPhone: "9876543210",
      }),
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      status: "READY", deliveryStatus: "ASSIGNED", deliveryPersonName: "Asha",
    }));
  });

  it.each([
    ["UNASSIGNED", "PICKED_UP"],
    ["ASSIGNED", "OUT_FOR_DELIVERY"],
    ["PICKED_UP", "DELIVERED"],
    ["DELIVERED", "ASSIGNED"],
  ])("rejects skipped or terminal transition %s -> %s", async (deliveryStatus, status) => {
    const database = createDatabase();
    database.order.findUnique.mockResolvedValue({ ...readyOrder, deliveryStatus });
    const response = createResponse();

    await getHandlers(database).handler(request({ status, deliveryPersonName: "Asha" }), response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(409);
    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ["ASSIGNED", "PICKED_UP"],
    ["PICKED_UP", "OUT_FOR_DELIVERY"],
  ])("allows the next delivery transition %s -> %s", async (deliveryStatus, status) => {
    const database = createDatabase();
    database.order.findUnique.mockResolvedValue({ ...readyOrder, deliveryStatus, deliveryPersonName: "Asha" });
    database.order.updateMany.mockResolvedValue({ count: 1 });
    const response = createResponse();

    await getHandlers(database).handler(request({ status }), response, vi.fn());

    expect(database.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 100n, status: "READY", deliveryStatus },
      data: expect.objectContaining({ status: "READY", deliveryStatus: status }),
    }));
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ status: "READY", deliveryStatus: status }));
  });

  it("marks a delivery complete and completes the ready order", async () => {
    const database = createDatabase();
    const notification = { createMany: vi.fn().mockResolvedValue({ count: 1 }) };
    Object.assign(database, {
      admin: { findMany: vi.fn().mockResolvedValue([{ id: 1n }]) },
      notification,
    });
    database.order.findUnique.mockResolvedValue({ ...readyOrder, deliveryStatus: "OUT_FOR_DELIVERY", deliveryPersonName: "Asha" });
    database.order.updateMany.mockResolvedValue({ count: 1 });
    const response = createResponse();

    await getHandlers(database).handler(request({ status: "DELIVERED" }), response, vi.fn());

    expect(database.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "COMPLETED", deliveryStatus: "DELIVERED" }),
    }));
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ status: "COMPLETED", deliveryStatus: "DELIVERED" }));
    expect(notification.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([expect.objectContaining({ adminId: 1n, title: "Delivery completed" })]),
    }));
  });

  it("rejects delivery updates for an order that is not ready", async () => {
    const database = createDatabase();
    database.order.findUnique.mockResolvedValue({ ...readyOrder, status: "PROCESSING" });
    const response = createResponse();

    await getHandlers(database).handler(request({ status: "ASSIGNED", deliveryPersonName: "Asha" }), response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(409);
    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("rejects non-admin roles through admin authorization", () => {
    const database = createDatabase();
    const response = createResponse(null, "WHOLESALER");
    const next = vi.fn();

    getHandlers(database).authorizationHandler({} as Request, response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a cross-role request without an authenticated admin", () => {
    const database = createDatabase();
    const response = createResponse(null);
    const next = vi.fn();

    getHandlers(database).authorizationHandler(
      { } as Request,
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing order", async () => {
    const database = createDatabase();
    database.order.findUnique.mockResolvedValue(null);
    const response = createResponse();

    await getHandlers(database).handler(
      request({ status: "ASSIGNED", deliveryPersonName: "Asha" }),
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ error: "Order not found" });
    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("requires a delivery person name only when assigning", async () => {
    const database = createDatabase();
    database.order.findUnique.mockResolvedValue(readyOrder);
    const response = createResponse();

    await getHandlers(database).handler(request({ status: "ASSIGNED", deliveryPersonName: "  " }), response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(database.order.updateMany).not.toHaveBeenCalled();
  });

  it("returns a conflict when the delivery is changed concurrently", async () => {
    const database = createDatabase();
    database.order.findUnique.mockResolvedValue(readyOrder);
    database.order.updateMany.mockResolvedValue({ count: 0 });
    const response = createResponse();

    await getHandlers(database).handler(request({ status: "ASSIGNED", deliveryPersonName: "Asha" }), response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({ error: "Delivery status changed. Refresh and try again." });
  });

  it("passes database failures to the shared error handler", async () => {
    const database = createDatabase();
    const databaseError = new Error("Database failure");
    database.order.findUnique.mockRejectedValue(databaseError);
    const response = createResponse();
    const next = vi.fn();

    await getHandlers(database).handler(request({ status: "ASSIGNED", deliveryPersonName: "Asha" }), response, next);

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});
