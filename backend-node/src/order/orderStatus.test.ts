import { describe, expect, it } from "vitest";

import {
  INITIAL_ORDER_STATUS,
  ORDER_STATUSES,
  canTransitionOrderStatus,
  isOrderStatus,
  transitionOrderStatus,
  type OrderStatus,
} from "./orderStatus.js";

describe("order status lifecycle", () => {
  it("recognizes every supported order status", () => {
    expect(ORDER_STATUSES).toEqual([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "READY",
      "COMPLETED",
      "CANCELLED",
    ]);

    for (const status of ORDER_STATUSES) {
      expect(isOrderStatus(status)).toBe(true);
    }

    expect(INITIAL_ORDER_STATUS).toBe("PENDING");
  });

  it("rejects invalid statuses", () => {
    for (const status of ["", "pending", "SHIPPED", "CANCELED"]) {
      expect(isOrderStatus(status)).toBe(false);
    }
  });

  it("completes the full normal lifecycle in order", () => {
    let status: OrderStatus = INITIAL_ORDER_STATUS;

    const lifecycle: OrderStatus[] = [
      "CONFIRMED",
      "PROCESSING",
      "READY",
      "COMPLETED",
    ];

    for (const nextStatus of lifecycle) {
      expect(canTransitionOrderStatus(status, nextStatus)).toBe(true);

      status = transitionOrderStatus(status, nextStatus);

      expect(status).toBe(nextStatus);
    }

    expect(status).toBe("COMPLETED");
  });

  it("allows cancellation only from pending and confirmed", () => {
    expect(canTransitionOrderStatus("PENDING", "CANCELLED")).toBe(true);
    expect(canTransitionOrderStatus("CONFIRMED", "CANCELLED")).toBe(true);

    expect(transitionOrderStatus("PENDING", "CANCELLED")).toBe("CANCELLED");
    expect(transitionOrderStatus("CONFIRMED", "CANCELLED")).toBe("CANCELLED");
  });

  it("rejects invalid jumps", () => {
    const transitions = [
      ["PENDING", "PROCESSING"],
      ["PENDING", "COMPLETED"],
      ["CONFIRMED", "READY"],
      ["PROCESSING", "CANCELLED"],
    ] as Array<[OrderStatus, OrderStatus]>;

    for (const [currentStatus, nextStatus] of transitions) {
      expect(canTransitionOrderStatus(currentStatus, nextStatus)).toBe(false);

      expect(() =>
        transitionOrderStatus(currentStatus, nextStatus),
      ).toThrow(
        `Invalid order status transition: ${currentStatus} -> ${nextStatus}`,
      );
    }
  });

  it("treats completed and cancelled orders as terminal", () => {
    for (const terminalStatus of [
      "COMPLETED",
      "CANCELLED",
    ] as OrderStatus[]) {
      for (const nextStatus of ORDER_STATUSES) {
        expect(
          canTransitionOrderStatus(terminalStatus, nextStatus),
        ).toBe(false);
      }
    }
  });

  it("throws clear errors for invalid transitionOrderStatus inputs", () => {
    expect(() =>
      transitionOrderStatus("UNKNOWN" as OrderStatus, "PENDING"),
    ).toThrow("Invalid current order status: UNKNOWN");

    expect(() =>
      transitionOrderStatus("PENDING", "UNKNOWN" as OrderStatus),
    ).toThrow("Invalid next order status: UNKNOWN");
  });
});