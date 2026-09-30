import type { PrismaClient } from "@prisma/client";
import { Router, type NextFunction, type Request, type Response } from "express";

import { requireAuthentication } from "../../middleware/authentication.js";
import { requireRole } from "../../middleware/authorization.js";

type Database = Pick<PrismaClient, "notification">;

export function createWholesalerNotificationsRouter({ database }: { database: Database }) {
  const listNotifications = async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const wholesalerId = response.locals.wholesalerId as bigint;
      const notifications = await database.notification.findMany({ where: { wholesalerId }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, message: true, isRead: true, createdAt: true } });
      response.status(200).json(notifications.map((notification) => ({ id: notification.id.toString(), title: notification.title, message: notification.message, isRead: notification.isRead, createdAt: notification.createdAt.toISOString() })));
    } catch (error) { next(error); }
  };
  const markRead = async (request: Request<{ id: string }>, response: Response, next: NextFunction) => {
    try {
      if (!/^\d+$/.test(request.params.id)) { response.status(400).json({ error: "Invalid notification ID" }); return; }
      const result = await database.notification.updateMany({ where: { id: BigInt(request.params.id), wholesalerId: response.locals.wholesalerId as bigint }, data: { isRead: true } });
      if (result.count === 0) { response.status(404).json({ error: "Notification not found" }); return; }
      response.status(200).json({ id: request.params.id, isRead: true });
    } catch (error) { next(error); }
  };
  const markAllRead = async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await database.notification.updateMany({ where: { wholesalerId: response.locals.wholesalerId as bigint, isRead: false }, data: { isRead: true } });
      response.status(200).json({ updated: result.count });
    } catch (error) { next(error); }
  };
  const router = Router();
  router.get("/", requireAuthentication, requireRole("WHOLESALER"), listNotifications);
  router.patch("/:id/read", requireAuthentication, requireRole("WHOLESALER"), markRead);
  router.patch("/read-all", requireAuthentication, requireRole("WHOLESALER"), markAllRead);
  return router;
}
