import type { RequestHandler } from "express";

export const requireAdminAuthentication: RequestHandler = (
  _request,
  response,
  next,
) => {
  if (response.locals.adminId === undefined) {
    return response.status(403).json({
      error: "Forbidden",
    });
  }

  return next();
};