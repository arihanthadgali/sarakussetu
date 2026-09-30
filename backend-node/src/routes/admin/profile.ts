import type { PrismaClient } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";

import { requireAuthentication } from "../../middleware/authentication.js";
import { requireAdminAuthentication } from "../../middleware/admin-authentication.js";

type Database = Pick<PrismaClient, "admin">;

export function createAdminProfileRouter({ database }: { database: Database }) {
  const getProfile = async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const admin = await database.admin.findUnique({
        where: { id: response.locals.adminId as bigint },
        select: { id: true, name: true, phoneNumber: true, createdAt: true },
      });
      if (admin === null) { response.status(404).json({ error: "Admin account not found" }); return; }
      response.status(200).json({ id: admin.id.toString(), name: admin.name, phoneNumber: admin.phoneNumber, createdAt: admin.createdAt.toISOString() });
    } catch (error) { next(error); }
  };
  const router = Router();
  router.get("/", requireAuthentication, requireAdminAuthentication, getProfile);
  return router;
}
