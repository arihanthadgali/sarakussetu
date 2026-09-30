import { Router } from "express";

import { prisma } from "../database/prisma.js";
import { requireAuthentication } from "../middleware/authentication.js";

import { createAdminAuthRouter } from "./admin/auth.js";
import { createAdminDeliveryRouter } from "./admin/delivery.js";
import { createAdminNotificationsRouter } from "./admin/notifications.js";
import { createAdminOrdersRouter } from "./admin/orders.js";
import { createAdminPaymentsRouter } from "./admin/payments.js";
import { createAdminProfileRouter } from "./admin/profile.js";
import { createAdminProductsRouter } from "./admin/products.js";
import { createAdminRetailersRouter } from "./admin/retailers.js";
import { createAdminWholesalersRouter } from "./admin/wholesalers.js";

import { createAuthenticatedCustomerRouter } from "./auth/me.js";
import { createOtpRouter } from "./auth/otp.js";
import { createCartRouter } from "./cart.js";
import { healthRouter } from "./health.js";
import { createOrdersRouter } from "./orders.js";
import { createPaymentsRouter } from "./payments.js";
import { createProductRouter } from "./products.js";

import { createWholesalerAuthRouter } from "./wholesaler/auth.js";
import { createWholesalerInventoryRouter } from "./wholesaler/inventory.js";
import { createWholesalerNotificationsRouter } from "./wholesaler/notifications.js";
import { createWholesalerOrderStatusRouter } from "./wholesaler/order-status.js";
import { createWholesalerOrdersRouter } from "./wholesaler/orders.js";

export const router = Router();

router.use("/api/health", healthRouter);

router.use("/api/auth/otp", createOtpRouter());
router.use("/api/auth", createAuthenticatedCustomerRouter());

router.use("/api/cart", createCartRouter());
router.use("/api/products", createProductRouter());

router.use(
  "/api/wholesaler/auth",
  createWholesalerAuthRouter(),
);

router.use(
  "/api/wholesaler/orders",
  createWholesalerOrdersRouter({
    database: prisma,
  }),
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
  "/api/wholesaler/notifications",
  createWholesalerNotificationsRouter({
    database: prisma,
  }),
);

router.use(
  "/api/admin/auth",
  createAdminAuthRouter(),
);

router.use(
  "/api/admin/products",
  createAdminProductsRouter({
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
  "/api/admin/orders",
  createAdminDeliveryRouter({
    database: prisma,
  }),
);

router.use(
  "/api/admin/notifications",
  createAdminNotificationsRouter({
    database: prisma,
  }),
);

router.use(
  "/api/admin/profile",
  createAdminProfileRouter({
    database: prisma,
  }),
);

router.use(
  "/api/admin/retailers",
  createAdminRetailersRouter({
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
  "/api/admin/payments",
  createAdminPaymentsRouter({
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

router.use(
  "/api/orders",
  createPaymentsRouter({
    database: prisma,
  }),
);
