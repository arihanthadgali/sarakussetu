import { Router } from "express";

import { createAuthenticatedCustomerRouter } from "./auth/me.js";
import { createOtpRouter } from "./auth/otp.js";
import { createCartRouter } from "./cart.js";
import { healthRouter } from "./health.js";
import { createOrdersRouter } from "./orders.js";
import { createProductRouter } from "./products.js";

import { prisma } from "../database/prisma.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { createAdminProductsRouter } from "./admin/products.js";

export const router = Router();

router.use("/api/health", healthRouter);
router.use("/api/auth/otp", createOtpRouter());
router.use("/api/auth", createAuthenticatedCustomerRouter());
router.use("/api/cart", createCartRouter());
router.use("/api/products", createProductRouter());
router.use(
  "/api/admin/products",
  createAdminProductsRouter({
    database: prisma,
  }),
);
router.use(
  "/api/orders",
  createOrdersRouter({
    database: prisma,
    requireAuthentication,
  }),
);