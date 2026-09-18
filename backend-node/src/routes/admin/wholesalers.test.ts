import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../../middleware/authentication.js";
import { createAdminWholesalersRouter } from "./wholesalers.js";

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
  wholesaler: {
    findMany: vi.fn(),
  },
  order: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
});

const getWholesalersHandler = (
  database: ReturnType<typeof createDatabase>,
) => {
  const router = createAdminWholesalersRouter({
    database: database as never,
  });

  const route = router.stack.find((layer) => {
  if (layer.route === undefined) {
    return false;
  }

  const route = layer.route as typeof layer.route & {
    methods: Record<string, boolean>;
  };

  return (
    layer.route.path === "/" &&
    route.methods.get === true
  );
});

  if (route?.route === undefined) {
    throw new Error("GET / route not found.");
  }

  const handlers = route.route.stack;

  const authenticationHandler = handlers[0];
  const authorizationHandler = handlers[1];
  const getWholesalersHandler = handlers[2];

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    authorizationHandler?.handle === undefined ||
    getWholesalersHandler?.handle === undefined
  ) {
    throw new Error(
      "GET / route middleware is not configured correctly.",
    );
  }

  return getWholesalersHandler.handle;
};

describe("admin wholesalers routes", () => {
  it("returns wholesalers sorted by business name", async () => {
    const database = createDatabase();

    database.wholesaler.findMany.mockResolvedValue([
      {
        id: 20n,
        businessName: "Hubli Wholesale",
        ownerName: "Ramesh",
        phoneNumber: "9876543210",
        city: "Hubli",
        pincode: "580020",
      },
      {
        id: 21n,
        businessName: "Laxmeshwar Wholesale",
        ownerName: "Suresh",
        phoneNumber: "9876543211",
        city: "Laxmeshwar",
        pincode: "582116",
      },
    ]);

    const response = createResponse();
    const handler = getWholesalersHandler(database);

    await handler(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(database.wholesaler.findMany).toHaveBeenCalledWith({
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

    expect(response.status).toHaveBeenCalledWith(200);

    expect(response.json).toHaveBeenCalledWith([
      {
        id: "20",
        businessName: "Hubli Wholesale",
        ownerName: "Ramesh",
        phoneNumber: "9876543210",
        city: "Hubli",
        pincode: "580020",
      },
      {
        id: "21",
        businessName: "Laxmeshwar Wholesale",
        ownerName: "Suresh",
        phoneNumber: "9876543211",
        city: "Laxmeshwar",
        pincode: "582116",
      },
    ]);
  });

  it("returns an empty list when there are no wholesalers", async () => {
    const database = createDatabase();

    database.wholesaler.findMany.mockResolvedValue([]);

    const response = createResponse();
    const handler = getWholesalersHandler(database);

    await handler(
      {} as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([]);
  });

  it("passes database errors to next", async () => {
    const database = createDatabase();
    const databaseError = new Error("Database failure");

    database.wholesaler.findMany.mockRejectedValue(databaseError);

    const response = createResponse();
    const next = vi.fn();
    const handler = getWholesalersHandler(database);

    await handler(
      {} as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});
