export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const INITIAL_ORDER_STATUS: OrderStatus = ORDER_STATUSES[0];

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function transitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): OrderStatus {
  if (!isOrderStatus(currentStatus)) {
    throw new Error(`Invalid current order status: ${currentStatus}`);
  }

  if (!isOrderStatus(nextStatus)) {
    throw new Error(`Invalid next order status: ${nextStatus}`);
  }

  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    throw new Error(
      `Invalid order status transition: ${currentStatus} -> ${nextStatus}`,
    );
  }

  return nextStatus;
}
