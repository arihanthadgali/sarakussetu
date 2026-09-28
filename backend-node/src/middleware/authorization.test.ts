import { describe, expect, it, vi } from "vitest";

import { requireAdminAuthentication } from "./admin-authentication.js";

const createResponse = (adminId?: bigint) => ({
  locals: {
    adminId,
  },
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

describe("requireAdminAuthentication", () => {
  it("allows an authenticated admin", () => {
    const response = createResponse(9n);
    const next = vi.fn();

    requireAdminAuthentication(
      {} as never,
      response as never,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });

  it("rejects a request without an admin id", () => {
    const response = createResponse();
    const next = vi.fn();

    requireAdminAuthentication(
      {} as never,
      response as never,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      error: "Forbidden",
    });
    expect(next).not.toHaveBeenCalled();
  });
});