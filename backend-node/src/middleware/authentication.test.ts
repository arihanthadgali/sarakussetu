import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyAccessTokenMock = vi.hoisted(() => vi.fn());
const findCustomerMock = vi.hoisted(() => vi.fn());
const findWholesalerMock = vi.hoisted(() => vi.fn());
const findAdminMock = vi.hoisted(() => vi.fn());

vi.mock("../modules/auth/jwt/jwt-verification-service.js", () => ({
  verifyAccessToken: verifyAccessTokenMock,
}));

vi.mock("../database/prisma.js", () => ({
  prisma: {
    customer: {
      findUnique: findCustomerMock,
    },
    wholesaler: {
      findUnique: findWholesalerMock,
    },
    admin: {
      findUnique: findAdminMock,
    },
  },
}));

import { requireAuthentication } from "./authentication.js";

const createRequest = (authorization?: string) => ({
  get: (header: string) =>
    header === "Authorization" ? authorization : undefined,
});

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    locals: {} as Record<string, unknown>,
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuthentication", () => {
  it("returns 401 when authorization header is missing", async () => {
    const request = createRequest();
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("authenticates a retailer using the customers table", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "7",
      tokenType: "RETAILER",
    });

    findCustomerMock.mockResolvedValue({
      id: 7n,
      role: "RETAILER",
    });

    const request = createRequest("Bearer retailer-token");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findCustomerMock).toHaveBeenCalledWith({
      where: { id: 7n },
      select: {
        id: true,
        role: true,
      },
    });

    expect(findWholesalerMock).not.toHaveBeenCalled();
    expect(findAdminMock).not.toHaveBeenCalled();

    expect(response.locals.customerId).toBe(7n);
    expect(response.locals.wholesalerId).toBeUndefined();
    expect(response.locals.adminId).toBeUndefined();
    expect(response.locals.role).toBe("RETAILER");
    expect(next).toHaveBeenCalledOnce();
  });

  it("authenticates a wholesaler using the wholesalers table", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "8",
      tokenType: "WHOLESALER",
    });

    findWholesalerMock.mockResolvedValue({
      id: 8n,
    });

    const request = createRequest("Bearer wholesaler-token");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findWholesalerMock).toHaveBeenCalledWith({
      where: { id: 8n },
      select: {
        id: true,
      },
    });

    expect(findCustomerMock).not.toHaveBeenCalled();
    expect(findAdminMock).not.toHaveBeenCalled();

    expect(response.locals.wholesalerId).toBe(8n);
    expect(response.locals.customerId).toBeUndefined();
    expect(response.locals.adminId).toBeUndefined();
    expect(response.locals.role).toBe("WHOLESALER");
    expect(next).toHaveBeenCalledOnce();
  });

  it("authenticates an admin using the admins table", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "9",
      tokenType: "ADMIN",
    });

    findAdminMock.mockResolvedValue({
      id: 9n,
    });

    const request = createRequest("Bearer admin-token");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findAdminMock).toHaveBeenCalledWith({
      where: { id: 9n },
      select: {
        id: true,
      },
    });

    expect(findCustomerMock).not.toHaveBeenCalled();
    expect(findWholesalerMock).not.toHaveBeenCalled();

    expect(response.locals.adminId).toBe(9n);
    expect(response.locals.customerId).toBeUndefined();
    expect(response.locals.wholesalerId).toBeUndefined();
    expect(response.locals.role).toBe("ADMIN");
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 401 when the admin does not exist", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "999",
      tokenType: "ADMIN",
    });

    findAdminMock.mockResolvedValue(null);

    const request = createRequest("Bearer unknown-admin-token");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findAdminMock).toHaveBeenCalledWith({
      where: { id: 999n },
      select: {
        id: true,
      },
    });

    expect(findCustomerMock).not.toHaveBeenCalled();
    expect(findWholesalerMock).not.toHaveBeenCalled();

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the retailer does not exist", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "999",
      tokenType: "RETAILER",
    });

    findCustomerMock.mockResolvedValue(null);

    const request = createRequest("Bearer unknown-retailer-token");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findCustomerMock).toHaveBeenCalledWith({
      where: { id: 999n },
      select: {
        id: true,
        role: true,
      },
    });

    expect(findWholesalerMock).not.toHaveBeenCalled();
    expect(findAdminMock).not.toHaveBeenCalled();

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the wholesaler does not exist", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "999",
      tokenType: "WHOLESALER",
    });

    findWholesalerMock.mockResolvedValue(null);

    const request = createRequest("Bearer unknown-wholesaler-token");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findWholesalerMock).toHaveBeenCalledWith({
      where: { id: 999n },
      select: {
        id: true,
      },
    });

    expect(findCustomerMock).not.toHaveBeenCalled();
    expect(findAdminMock).not.toHaveBeenCalled();

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the customer has an invalid role", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "10",
      tokenType: "RETAILER",
    });

    findCustomerMock.mockResolvedValue({
      id: 10n,
      role: "INVALID_ROLE",
    });

    const request = createRequest("Bearer invalid-role-token");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findCustomerMock).toHaveBeenCalledWith({
      where: { id: 10n },
      select: {
        id: true,
        role: true,
      },
    });

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when tokenType is missing", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "7",
    });

    const request = createRequest("Bearer token-without-type");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findCustomerMock).not.toHaveBeenCalled();
    expect(findWholesalerMock).not.toHaveBeenCalled();
    expect(findAdminMock).not.toHaveBeenCalled();

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: "Unauthorized",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("does not allow a wholesaler token to authenticate as a customer", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "8",
      tokenType: "WHOLESALER",
    });

    findWholesalerMock.mockResolvedValue(null);

    const request = createRequest("Bearer wholesaler-token");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findWholesalerMock).toHaveBeenCalledWith({
      where: { id: 8n },
      select: {
        id: true,
      },
    });

    expect(findCustomerMock).not.toHaveBeenCalled();
    expect(findAdminMock).not.toHaveBeenCalled();

    expect(response.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("does not allow an admin token to authenticate as a customer", async () => {
    verifyAccessTokenMock.mockResolvedValue({
      sub: "9",
      tokenType: "ADMIN",
    });

    findAdminMock.mockResolvedValue({
      id: 9n,
    });

    const request = createRequest("Bearer admin-token");
    const response = createResponse();
    const next = vi.fn();

    await requireAuthentication(
      request as never,
      response as never,
      next,
    );

    expect(findAdminMock).toHaveBeenCalledWith({
      where: { id: 9n },
      select: {
        id: true,
      },
    });

    expect(findCustomerMock).not.toHaveBeenCalled();
    expect(findWholesalerMock).not.toHaveBeenCalled();

    expect(response.locals.adminId).toBe(9n);
    expect(response.locals.customerId).toBeUndefined();
    expect(response.locals.role).toBe("ADMIN");
    expect(next).toHaveBeenCalledOnce();
  });
});