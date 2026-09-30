import { Decimal } from "@prisma/client/runtime/library";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { requireAuthentication } from "../../middleware/authentication.js";
import { createAdminProductsRouter } from "./products.js";

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
  product: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
});

const getProductsHandler = (database: ReturnType<typeof createDatabase>) => {
  const router = createAdminProductsRouter({ database: database as never });
  const route = router.stack.find((layer) => layer.route?.path === "/");

  if (route?.route === undefined) {
    throw new Error("GET / route not found.");
  }

  const [authenticationHandler, authorizationHandler, productsHandler] =
    route.route.stack;

  if (
    authenticationHandler?.handle !== requireAuthentication ||
    authorizationHandler?.handle === undefined ||
    productsHandler?.handle === undefined
  ) {
    throw new Error("GET / route middleware is not configured correctly.");
  }

  return productsHandler.handle;
};


const getUpdateProductHandler = (database: ReturnType<typeof createDatabase>) => {
  const router = createAdminProductsRouter({ database: database as never });
  const route = router.stack.find((layer) => layer.route?.path === "/:id");

  if (route?.route === undefined) {
    throw new Error("PATCH /:id route not found.");
  }

  const productsHandler = route.route.stack.at(-1)?.handle;
  if (productsHandler === undefined) {
    throw new Error("PATCH /:id handler not found.");
  }

  return productsHandler;
};

describe("admin products routes", () => {
  it("returns active and inactive products for admins", async () => {
    const database = createDatabase();
    database.product.findMany.mockResolvedValue([
      {
        id: 8n,
        name: "Tomato Paste",
        description: "Kitchen staple",
        price: new Decimal("120.00"),
        imageUrl: "/uploads/products/12345678-1234-1234-1234-123456789012.webp",
        active: false,
        createdAt: new Date("2026-09-10T01:00:00.000Z"),
        updatedAt: new Date("2026-09-12T01:00:00.000Z"),
      },
    ]);
    const response = createResponse();

    await getProductsHandler(database)({} as Request, response, vi.fn());

    expect(database.product.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
      select: expect.any(Object),
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([
      {
        id: 8,
        name: "Tomato Paste",
        description: "Kitchen staple",
        price: 120,
        imageUrl: "/uploads/products/12345678-1234-1234-1234-123456789012.webp",
        active: false,
        createdAt: "2026-09-10T01:00:00.000Z",
        updatedAt: "2026-09-12T01:00:00.000Z",
      },
    ]);
  });

  it("returns an empty product list", async () => {
    const database = createDatabase();
    database.product.findMany.mockResolvedValue([]);
    const response = createResponse();

    await getProductsHandler(database)({} as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith([]);
  });

  it("passes database failures to the shared error handler", async () => {
    const database = createDatabase();
    const databaseError = new Error("Database failure");
    database.product.findMany.mockRejectedValue(databaseError);
    const response = createResponse();
    const next = vi.fn();

    await getProductsHandler(database)({} as Request, response, next);

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});


describe("admin product updates", () => {
  it("updates a product price and status", async () => {
    const database = createDatabase();
    database.product.update.mockResolvedValue({
      id: 8n,
      name: "Tomato Paste",
      description: "Kitchen staple",
      price: new Decimal("135.50"),
      imageUrl: null,
      active: true,
      createdAt: new Date("2026-09-10T01:00:00.000Z"),
      updatedAt: new Date("2026-09-30T01:00:00.000Z"),
    });

    const response = createResponse();
    const next = vi.fn();
    const handler = getUpdateProductHandler(database);

    await handler(
      {
        params: { id: "8" },
        body: { price: 135.5, active: true },
      } as unknown as Request,
      response,
      next,
    );

    expect(database.product.update).toHaveBeenCalledWith({
      where: { id: 8n },
      data: {
        price: 135.5,
        active: true,
        updatedAt: expect.any(Date),
      },
      select: expect.any(Object),
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 8,
        price: 135.5,
        active: true,
        imageUrl: null,
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });
});
