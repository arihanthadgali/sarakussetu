import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../../middleware/authentication.js";
import { createAdminRetailersRouter } from "./retailers.js";

const createResponse = () => {
  const response = {
    locals: { role: "ADMIN", adminId: 1n },
    json: vi.fn(),
    status: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response as unknown as Response;
};

const createDatabase = () => ({
  customer: {
    findMany: vi.fn(),
  },
});

const getRetailersHandler = (database: ReturnType<typeof createDatabase>) => {
  const router = createAdminRetailersRouter({ database: database as never });
  const route = router.stack.find((layer) => layer.route?.path === "/");

  if (route?.route === undefined) {
    throw new Error("GET / route not found.");
  }

  const [authenticationHandler, authorizationHandler, retailersHandler] =
    route.route.stack;

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    authorizationHandler?.handle === undefined ||
    retailersHandler?.handle === undefined
  ) {
    throw new Error("GET / route middleware is not configured correctly.");
  }

  return retailersHandler.handle;
};

describe("admin retailers routes", () => {
  it("returns registered retailers from the customer table", async () => {
    const database = createDatabase();
    database.customer.findMany.mockResolvedValue([
      {
        id: 5n,
        phoneNumber: "9876543210",
        createdAt: new Date("2026-09-12T01:00:00.000Z"),
      },
    ]);
    const response = createResponse();
    const handler = getRetailersHandler(database);

    await handler({} as Request, response, vi.fn());

    expect(database.customer.findMany).toHaveBeenCalledWith({
      where: { role: "RETAILER" },
      orderBy: { createdAt: "desc" },
      select: { id: true, phoneNumber: true, createdAt: true },
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      {
        id: "5",
        phoneNumber: "9876543210",
        createdAt: "2026-09-12T01:00:00.000Z",
      },
    ]);
  });

  it("returns an empty retailer list", async () => {
    const database = createDatabase();
    database.customer.findMany.mockResolvedValue([]);
    const response = createResponse();

    await getRetailersHandler(database)({} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([]);
  });

  it("passes database failures to the shared error handler", async () => {
    const database = createDatabase();
    const databaseError = new Error("Database failure");
    database.customer.findMany.mockRejectedValue(databaseError);
    const response = createResponse();
    const next = vi.fn();

    await getRetailersHandler(database)({} as Request, response, next);

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});
