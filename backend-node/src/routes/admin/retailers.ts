import type { PrismaClient } from "@prisma/client";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { requireAuthentication } from "../../middleware/authentication.js";
import { requireAdminAuthentication } from "../../middleware/admin-authentication.js";

type Database = Pick<PrismaClient, "customer">;

export function createAdminRetailersRouter({
  database,
}: {
  database: Database;
}) {
  const getRetailers = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const retailers = await database.customer.findMany({
        where: {
          role: "RETAILER",
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          phoneNumber: true,
          createdAt: true,
        },
      });

      response.status(200).json(
        retailers.map((retailer) => ({
          id: retailer.id.toString(),
          phoneNumber: retailer.phoneNumber,
          createdAt: retailer.createdAt.toISOString(),
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
    requireAdminAuthentication,
    getRetailers,
  );

  return router;
}
