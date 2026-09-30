import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { createWholesalerNotificationsRouter } from "./notifications.js";

const createDatabase = () => ({ notification: { findMany: vi.fn(), updateMany: vi.fn() } });
const response = (role = "WHOLESALER", wholesalerId: bigint | undefined = 2n) => { const value = { locals: wholesalerId === undefined ? { role } : { role, wholesalerId }, status: vi.fn(), json: vi.fn() }; value.status.mockReturnValue(value); return value as unknown as Response; };
const handlers = (database: ReturnType<typeof createDatabase>, path: string, method: "get" | "patch") => { const router = createWholesalerNotificationsRouter({ database: database as never }); const layer = router.stack.find((item) => item.route?.path === path && (item.route as unknown as { methods: Record<string, boolean> }).methods[method]); if (layer?.route === undefined) throw new Error("Notification route missing"); return layer.route.stack.map((item) => item.handle); };

describe("wholesaler notifications routes", () => {
  it("lists the authenticated wholesaler notifications and supports empty results", async () => {
    const database = createDatabase(); database.notification.findMany.mockResolvedValue([]); const res = response();
    await handlers(database, "/", "get")[2]!({} as Request, res, vi.fn());
    expect(database.notification.findMany).toHaveBeenCalledWith({ where: { wholesalerId: 2n }, orderBy: { createdAt: "desc" }, select: expect.any(Object) });
    expect(res.json).toHaveBeenCalledWith([]);
  });
  it("marks only an owned notification as read", async () => {
    const database = createDatabase(); database.notification.updateMany.mockResolvedValue({ count: 1 }); const res = response("WHOLESALER", 4n);
    await handlers(database, "/:id/read", "patch")[2]!({ params: { id: "5" } } as unknown as Request, res, vi.fn());
    expect(database.notification.updateMany).toHaveBeenCalledWith({ where: { id: 5n, wholesalerId: 4n }, data: { isRead: true } });
  });
  it("rejects cross-wholesaler updates and marks all owned unread notifications", async () => {
    const database = createDatabase(); database.notification.updateMany.mockResolvedValueOnce({ count: 0 }); const res = response("WHOLESALER", 4n);
    await handlers(database, "/:id/read", "patch")[2]!({ params: { id: "5" } } as unknown as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    database.notification.updateMany.mockResolvedValueOnce({ count: 3 });
    await handlers(database, "/read-all", "patch")[2]!({} as Request, res, vi.fn());
    expect(database.notification.updateMany).toHaveBeenLastCalledWith({ where: { wholesalerId: 4n, isRead: false }, data: { isRead: true } });
  });
  it("rejects wrong roles and forwards database errors", async () => {
    const database = createDatabase(); const forbidden = response("ADMIN", undefined); const next = vi.fn();
    handlers(database, "/", "get")[1]!({} as Request, forbidden, next);
    expect(forbidden.status).toHaveBeenCalledWith(403);
    const failure = new Error("database unavailable"); database.notification.findMany.mockRejectedValue(failure); const res = response(); const errorNext = vi.fn();
    await handlers(database, "/", "get")[2]!({} as Request, res, errorNext);
    expect(errorNext).toHaveBeenCalledWith(failure);
  });
});
