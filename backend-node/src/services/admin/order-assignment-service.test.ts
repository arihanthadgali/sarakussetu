import { Decimal } from "@prisma/client/runtime/library";
import { describe, expect, it, vi } from "vitest";

import { createOrderAssignmentService } from "./order-assignment-service.js";

const createDatabase = () => ({
  order: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
  wholesaler: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
});

describe("createOrderAssignmentService", () => {
  describe("getUnassignedOrders", () => {
    it("returns orders where wholesalerId is null", async () => {
      const database = createDatabase();

      const orders = [
        {
          id: 100n,
          status: "PENDING",
          subtotal: new Decimal("1250.50"),
          createdAt: new Date("2026-09-18T08:00:00.000Z"),
          updatedAt: new Date("2026-09-18T08:00:00.000Z"),
          customer: {
            id: 1n,
            phoneNumber: "9876543210",
          },
          items: [],
        },
      ];

      database.order.findMany.mockResolvedValue(orders);

      const service = createOrderAssignmentService({
        database: database as never,
      });

      const result = await service.getUnassignedOrders();

      expect(database.order.findMany).toHaveBeenCalledWith({
        where: {
          wholesalerId: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          subtotal: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              phoneNumber: true,
            },
          },
          items: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              productId: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
            },
          },
        },
      });

      expect(result).toEqual(orders);
    });

    it("returns an empty list when there are no unassigned orders", async () => {
      const database = createDatabase();

      database.order.findMany.mockResolvedValue([]);

      const service = createOrderAssignmentService({
        database: database as never,
      });

      const result = await service.getUnassignedOrders();

      expect(result).toEqual([]);
    });

    it("propagates database errors", async () => {
      const database = createDatabase();
      const error = new Error("Database unavailable");

      database.order.findMany.mockRejectedValue(error);

      const service = createOrderAssignmentService({
        database: database as never,
      });

      await expect(service.getUnassignedOrders()).rejects.toThrow(
        "Database unavailable",
      );
    });
  });

  describe("getWholesalers", () => {
    it("returns wholesalers ordered by business name", async () => {
      const database = createDatabase();

      const wholesalers = [
        {
          id: 2n,
          businessName: "ABC Distributors",
          ownerName: "Owner A",
          phoneNumber: "9876543210",
          city: "Hubli",
          pincode: "580020",
        },
        {
          id: 1n,
          businessName: "XYZ Traders",
          ownerName: "Owner B",
          phoneNumber: "9876543211",
          city: "Dharwad",
          pincode: "580001",
        },
      ];

      database.wholesaler.findMany.mockResolvedValue(wholesalers);

      const service = createOrderAssignmentService({
        database: database as never,
      });

      const result = await service.getWholesalers();

      expect(database.wholesaler.findMany).toHaveBeenCalledWith({
        orderBy: {
          businessName: "asc",
        },
        select: {
          id: true,
          businessName: true,
          ownerName: true,
          phoneNumber: true,
          city: true,
          pincode: true,
        },
      });

      expect(result).toEqual(wholesalers);
    });

    it("propagates database errors", async () => {
      const database = createDatabase();
      const error = new Error("Database unavailable");

      database.wholesaler.findMany.mockRejectedValue(error);

      const service = createOrderAssignmentService({
        database: database as never,
      });

      await expect(service.getWholesalers()).rejects.toThrow(
        "Database unavailable",
      );
    });
  });

  describe("assignOrder", () => {
    it("assigns an unassigned order to a wholesaler", async () => {
      const database = createDatabase();

      const wholesaler = {
        id: 10n,
        businessName: "Hubli Wholesale",
      };

      const updatedOrder = {
        id: 100n,
        status: "PENDING",
        wholesalerId: 10n,
        subtotal: new Decimal("1250.50"),
        updatedAt: new Date("2026-09-18T09:00:00.000Z"),
      };

      database.wholesaler.findUnique.mockResolvedValue(wholesaler);
      database.order.updateMany.mockResolvedValue({ count: 1 });
      database.order.findUnique.mockResolvedValue(updatedOrder);

      const service = createOrderAssignmentService({
        database: database as never,
      });

      const result = await service.assignOrder(100n, 10n);

      expect(database.wholesaler.findUnique).toHaveBeenCalledWith({
        where: {
          id: 10n,
        },
        select: {
          id: true,
          businessName: true,
        },
      });

      expect(database.order.updateMany).toHaveBeenCalledWith({
        where: {
          id: 100n,
        },
        data: {
          wholesalerId: 10n,
          updatedAt: expect.any(Date),
        },
      });

      expect(database.order.findUnique).toHaveBeenCalledWith({
        where: {
          id: 100n,
        },
        select: {
          id: true,
          status: true,
          wholesalerId: true,
          subtotal: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual({
        type: "assigned",
        order: updatedOrder,
        wholesaler,
      });
    });

    it("returns wholesaler_not_found when the wholesaler does not exist", async () => {
      const database = createDatabase();

      database.wholesaler.findUnique.mockResolvedValue(null);

      const service = createOrderAssignmentService({
        database: database as never,
      });

      const result = await service.assignOrder(100n, 999n);

      expect(result).toEqual({
        type: "wholesaler_not_found",
      });

      expect(database.order.updateMany).not.toHaveBeenCalled();
    });

    it("returns order_not_found when the order does not exist", async () => {
      const database = createDatabase();

      database.wholesaler.findUnique.mockResolvedValue({
        id: 10n,
        businessName: "Hubli Wholesale",
      });

      database.order.updateMany.mockResolvedValue({
        count: 0,
      });

      const service = createOrderAssignmentService({
        database: database as never,
      });

      const result = await service.assignOrder(999n, 10n);

      expect(result).toEqual({
        type: "order_not_found",
      });
    });

    it("returns order_not_found when no order is updated", async () => {
      const database = createDatabase();

      database.wholesaler.findUnique.mockResolvedValue({
        id: 10n,
        businessName: "Hubli Wholesale",
      });

      database.order.updateMany.mockResolvedValue({
        count: 0,
      });

      const service = createOrderAssignmentService({
        database: database as never,
      });

      const result = await service.assignOrder(100n, 10n);

      expect(result).toEqual({
        type: "order_not_found",
      });
    });

    it("allows an admin to reassign an order", async () => {
      const database = createDatabase();

      database.wholesaler.findUnique.mockResolvedValue({
        id: 10n,
        businessName: "Hubli Wholesale",
      });

      database.order.updateMany.mockResolvedValue({ count: 1 });

      database.order.findUnique.mockResolvedValue({
        id: 100n,
        wholesalerId: 20n,
        status: "PENDING",
        subtotal: new Decimal("250.00"),
        updatedAt: new Date("2026-09-18T09:00:00.000Z"),
      });

      const service = createOrderAssignmentService({
        database: database as never,
      });

      await service.assignOrder(100n, 10n);

      expect(database.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 100n,
          }),
        }),
      );
    });

    it("propagates wholesaler database errors", async () => {
      const database = createDatabase();
      const error = new Error("Wholesaler lookup failed");

      database.wholesaler.findUnique.mockRejectedValue(error);

      const service = createOrderAssignmentService({
        database: database as never,
      });

      await expect(service.assignOrder(100n, 10n)).rejects.toThrow(
        "Wholesaler lookup failed",
      );
    });

    it("propagates order update database errors", async () => {
      const database = createDatabase();
      const error = new Error("Order update failed");

      database.wholesaler.findUnique.mockResolvedValue({
        id: 10n,
        businessName: "Hubli Wholesale",
      });

      database.order.updateMany.mockRejectedValue(error);

      const service = createOrderAssignmentService({
        database: database as never,
      });

      await expect(service.assignOrder(100n, 10n)).rejects.toThrow(
        "Order update failed",
      );
    });
  });
});
