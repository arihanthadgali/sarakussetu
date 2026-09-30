import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { createAdminProfileRouter } from "./profile.js";

describe("admin profile route", () => {
  it("uses the authenticated admin identity and rejects missing admin context", async () => {
    const database = { admin: { findUnique: vi.fn().mockResolvedValue({ id: 3n, name: "Asha", phoneNumber: "9876543210", createdAt: new Date("2026-01-01T00:00:00.000Z") }) } };
    const router = createAdminProfileRouter({ database: database as never }); const route = router.stack.find((layer) => layer.route?.path === "/"); if (route?.route === undefined) throw new Error("Profile route missing");
    const res = { locals: { adminId: 3n }, status: vi.fn(), json: vi.fn() }; res.status.mockReturnValue(res);
    await route.route.stack[2]?.handle({} as Request, res as unknown as Response, vi.fn());
    expect(database.admin.findUnique).toHaveBeenCalledWith({ where: { id: 3n }, select: expect.any(Object) });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: "3", name: "Asha" }));
    const forbidden = { locals: {}, status: vi.fn(), json: vi.fn() }; forbidden.status.mockReturnValue(forbidden);
    route.route.stack[1]?.handle({} as Request, forbidden as unknown as Response, vi.fn());
    expect(forbidden.status).toHaveBeenCalledWith(403);
  });
});
