import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { requireAuthentication } from "../../middleware/authentication.js";
import { requireRole } from "../../middleware/authorization.js";
import { createOrderAssignmentService } from "../../services/admin/order-assignment-service.js";

type Database = Parameters<
  typeof createOrderAssignmentService
>[0]["database"];

export function createAdminWholesalersRouter({
  database,
}: {
  database: Database;
}) {
  const assignmentService = createOrderAssignmentService({
    database,
  });

  const getWholesalers = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const wholesalers =
        await assignmentService.getWholesalers();

      response.status(200).json(
        wholesalers.map((wholesaler) => ({
          id: wholesaler.id.toString(),
          businessName: wholesaler.businessName,
          ownerName: wholesaler.ownerName,
          phoneNumber: wholesaler.phoneNumber,
          city: wholesaler.city,
          pincode: wholesaler.pincode,
        })),
      );
    } catch (error) {
      next(error);
    }
  };

  const router = Router();

  router.get(
    "/",
    requireAuthentication,
    requireRole("ADMIN"),
    getWholesalers,
  );

  return router;
}