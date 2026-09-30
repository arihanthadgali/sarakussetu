import type { Prisma, PrismaClient } from "@prisma/client";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { requireAuthentication } from "../../middleware/authentication.js";
import { requireRole } from "../../middleware/authorization.js";

type Database = PrismaClient;

const inventorySelection = {
  stockQuantity: true,
  unit: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      name: true,
      price: true,
      active: true,
    },
  },
} satisfies Prisma.WholesalerInventorySelect;

const serializeDecimal = (value: { toNumber(): number }): number =>
  value.toNumber();

export function createWholesalerInventoryRouter({
  database,
}: {
  database: Database;
}) {
  const getInventory = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const wholesalerId = response.locals.wholesalerId as bigint | undefined;

      if (wholesalerId === undefined) {
        response.status(401).json({ error: "Unauthorized" });
        return;
      }

      const inventory = await database.wholesalerInventory.findMany({
        where: { wholesalerId },
        orderBy: {
          product: {
            name: "asc",
          },
        },
        select: inventorySelection,
      });

      response.status(200).json(
        inventory.map((item) => ({
          product: {
            id: Number(item.product.id),
            name: item.product.name,
            price: serializeDecimal(item.product.price),
            active: item.product.active,
          },
          stockQuantity: item.stockQuantity,
          unit: item.unit,
          updatedAt: item.updatedAt.toISOString(),
        })),
      );
    } catch (error) {
      next(error);
    }
  };

  const router = Router();

  router.get(
    "/",
    requireAuthentication,
    requireRole("WHOLESALER"),
    getInventory,
  );

  return router;
}
