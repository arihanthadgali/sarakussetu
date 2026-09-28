import { Router } from "express";

import { createAuthenticatedCustomerRouter } from "./auth/me.js";
import { createOtpRouter } from "./auth/otp.js";
import { createCartRouter } from "./cart.js";
import { healthRouter } from "./health.js";
import { createOrdersRouter } from "./orders.js";
import { createProductRouter } from "./products.js";

import { prisma } from "../database/prisma.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { createWholesalerOrdersRouter } from "./wholesaler/orders.js";
import { createWholesalerOrderStatusRouter } from "./wholesaler/order-status.js";
import { createWholesalerInventoryRouter } from "./wholesaler/inventory.js";
import { createWholesalerAuthRouter } from "./wholesaler/auth.js";
import { createAdminOrdersRouter } from "./admin/orders.js";
import { createAdminWholesalersRouter } from "./admin/wholesalers.js";
import { createAdminAuthRouter } from './admin/auth.js';

export const router = Router();

router.use("/api/health", healthRouter);
router.use("/api/auth/otp", createOtpRouter());
router.use("/api/auth", createAuthenticatedCustomerRouter());
router.use("/api/cart", createCartRouter());
router.use("/api/products", createProductRouter());

router.use(
  "/api/wholesaler/orders",
  createWholesalerOrdersRouter({
    database: prisma,
  }),
);
router.use(
  "/api/wholesaler/auth",
  createWholesalerAuthRouter(),
);
router.use(
  "/api/wholesaler/orders",
  createWholesalerOrderStatusRouter({
    database: prisma,
  }),
);
router.use(
  "/api/wholesaler/inventory",
  createWholesalerInventoryRouter({
    database: prisma,
  }),
);
router.use(
  "/api/admin/orders",
  createAdminOrdersRouter({
    database: prisma,
  }),
);

router.use(
  "/api/admin/wholesalers",
  createAdminWholesalersRouter({
    database: prisma,
  }),
);
router.use(
  '/api/admin/auth',
  createAdminAuthRouter(),
);
router.use(
  "/api/orders",
  createOrdersRouter({
    database: prisma,
    requireAuthentication,
  }),
);
