import type { RequestHandler } from "express";

import { isUserRole, type UserRole } from "../modules/auth/authorization/roles.js";

export const requireRole =
  (...allowedRoles: UserRole[]): RequestHandler =>
  (_request, response, next) => {
    const role = response.locals.role;

    if (typeof role !== "string" || !isUserRole(role)) {
      return response.status(403).json({ error: "Forbidden" });
    }

    if (!allowedRoles.includes(role)) {
      return response.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
