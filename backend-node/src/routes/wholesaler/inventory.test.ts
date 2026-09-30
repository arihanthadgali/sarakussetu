import { Decimal } from "@prisma/client/runtime/library";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../../middleware/authentication.js";
import { createWholesalerInventoryRouter } from "./inventory.js";

const createResponse = (wholesalerId?: bigint) => {
  const response = {
    locals:
      wholesalerId === undefined
        ? { role: "WHOLESALER" }
        : { role: "WHOLESALER", wholesalerId },
    json: vi.fn(),
    status: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response as unknown as Response;
};

const createDatabase = () => ({
  wholesalerInventory: {
    findMany: vi.fn().mockResolvedValue([]),
  },
});

const getInventoryHandler = (
  database: ReturnType<typeof createDatabase>,
) => {
  const router = createWholesalerInventoryRouter({
    database: database as never,
  });

  const route = router.stack.find((layer) => layer.route?.path === "/");

  if (route?.route === undefined) {
    throw new Error("GET / route not found.");
  }

  const handlers = route.route.stack;
  const authenticationHandler = handlers[0];
  const inventoryHandler = handlers[2];

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    inventoryHandler?.handle === undefined
  ) {
    throw new Error("GET / route middleware is not configured correctly.");
  }

  return inventoryHandler.handle;
};

describe("wholesaler inventory routes", () => {
  it("returns inventory assigned to the authenticated wholesaler", async () => {
    const database = createDatabase();
    database.wholesalerInventory.findMany.mockResolvedValue([
      {
        stockQuantity: 24,
        unit: "boxes",
        updatedAt: new Date("2026-09-28T08:00:00.000Z"),
        product: {
          id: 101n,
          name: "Tomato Paste",
          price: new Decimal("120.00"),
          active: true,
        },
      },
    ]);

    const response = createResponse(20n);
    const handler = getInventoryHandler(database);

    await handler({} as Request, response, vi.fn());

    expect(database.wholesalerInventory.findMany).toHaveBeenCalledWith({
      where: { wholesalerId: 20n },
      orderBy: { product: { name: "asc" } },
      select: expect.any(Object),
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      {
        product: {
          id: 101,
          name: "Tomato Paste",
          price: 120,
          active: true,
        },
        stockQuantity: 24,
        unit: "boxes",
        updatedAt: "2026-09-28T08:00:00.000Z",
      },
    ]);
  });

  it("rejects a request without a wholesaler identity", async () => {
    const database = createDatabase();
    const response = createResponse();
    const handler = getInventoryHandler(database);

    await handler({} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(database.wholesalerInventory.findMany).not.toHaveBeenCalled();
  });

  it("passes database failures to the shared error handler", async () => {
    const database = createDatabase();
    const databaseError = new Error("Database failure");
    database.wholesalerInventory.findMany.mockRejectedValue(databaseError);
    const response = createResponse(20n);
    const next = vi.fn();
    const handler = getInventoryHandler(database);

    await handler({} as Request, response, next);

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});
