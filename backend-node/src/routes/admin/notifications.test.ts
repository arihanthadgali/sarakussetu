import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { createAdminNotificationsRouter } from "./notifications.js";

const createDatabase = () => ({ notification: { findMany: vi.fn(), updateMany: vi.fn() } });
const response = (adminId: bigint | null = 1n) => { const value = { locals: adminId === null ? {} : { adminId }, status: vi.fn(), json: vi.fn() }; value.status.mockReturnValue(value); return value as unknown as Response; };
const handlers = (database: ReturnType<typeof createDatabase>, path: string, method: "get" | "patch") => { const router = createAdminNotificationsRouter({ database: database as never }); const layer = router.stack.find((item) => item.route?.path === path && (item.route as unknown as { methods: Record<string, boolean> }).methods[method]); if (layer?.route === undefined) throw new Error("Notification route missing"); return layer.route.stack.map((item) => item.handle); };

describe("admin notifications routes", () => {
  it("lists authenticated admin notifications newest first and supports empty results", async () => {
    const database = createDatabase(); database.notification.findMany.mockResolvedValue([]); const res = response();
    await handlers(database, "/", "get")[2]!({} as Request, res, vi.fn());
    expect(database.notification.findMany).toHaveBeenCalledWith({ where: { adminId: 1n }, orderBy: { createdAt: "desc" }, select: expect.any(Object) });
    expect(res.json).toHaveBeenCalledWith([]);
  });
  it("marks only an owned notification as read", async () => {
    const database = createDatabase(); database.notification.updateMany.mockResolvedValue({ count: 1 }); const res = response(7n);
    await handlers(database, "/:id/read", "patch")[2]!({ params: { id: "5" } } as unknown as Request, res, vi.fn());
    expect(database.notification.updateMany).toHaveBeenCalledWith({ where: { id: 5n, adminId: 7n }, data: { isRead: true } });
    expect(res.json).toHaveBeenCalledWith({ id: "5", isRead: true });
  });
  it("rejects cross-admin notification updates", async () => {
    const database = createDatabase(); database.notification.updateMany.mockResolvedValue({ count: 0 }); const res = response(7n);
    await handlers(database, "/:id/read", "patch")[2]!({ params: { id: "5" } } as unknown as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });
  it("marks all unread notifications for the authenticated admin", async () => {
    const database = createDatabase(); database.notification.updateMany.mockResolvedValue({ count: 2 }); const res = response(7n);
    await handlers(database, "/read-all", "patch")[2]!({} as Request, res, vi.fn());
    expect(database.notification.updateMany).toHaveBeenCalledWith({ where: { adminId: 7n, isRead: false }, data: { isRead: true } });
    expect(res.json).toHaveBeenCalledWith({ updated: 2 });
  });
  it("rejects access without an authenticated admin and forwards database failures", async () => {
    const database = createDatabase(); const forbidden = response(null); const next = vi.fn();
    handlers(database, "/", "get")[1]!({} as Request, forbidden, next);
    expect(forbidden.status).toHaveBeenCalledWith(403);
    const failure = new Error("database unavailable"); database.notification.findMany.mockRejectedValue(failure); const res = response(); const errorNext = vi.fn();
    await handlers(database, "/", "get")[2]!({} as Request, res, errorNext);
    expect(errorNext).toHaveBeenCalledWith(failure);
  });
});
