import { describe, expect, it, vi } from "vitest";

import { requireRole } from "./authorization.js";

const createResponse = (role?: string) => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  locals: role === undefined ? {} : { role },
});

describe("requireRole", () => {
  it("allows a user with an allowed role", () => {
    const request = {};
    const response = createResponse("WHOLESALER");
    const next = vi.fn();

    requireRole("WHOLESALER")(
      request as never,
      response as never,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });

  it("allows any one of multiple allowed roles", () => {
    const request = {};
    const response = createResponse("ADMIN");
    const next = vi.fn();

    requireRole("WHOLESALER", "ADMIN")(
      request as never,
      response as never,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });

  it("rejects a user with the wrong role", () => {
    const request = {};
    const response = createResponse("RETAILER");
    const next = vi.fn();

    requireRole("WHOLESALER")(
      request as never,
      response as never,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      error: "Forbidden",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a request without a role", () => {
    const request = {};
    const response = createResponse();
    const next = vi.fn();

    requireRole("WHOLESALER")(
      request as never,
      response as never,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      error: "Forbidden",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid role", () => {
    const request = {};
    const response = createResponse("INVALID_ROLE");
    const next = vi.fn();

    requireRole("ADMIN")(
      request as never,
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
