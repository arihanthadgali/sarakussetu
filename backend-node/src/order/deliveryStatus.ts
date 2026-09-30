export const DELIVERY_STATUSES = [
  "UNASSIGNED",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

const DELIVERY_TRANSITIONS: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  UNASSIGNED: ["ASSIGNED"],
  ASSIGNED: ["PICKED_UP"],
  PICKED_UP: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
};

export const isDeliveryStatus = (value: unknown): value is DeliveryStatus =>
  typeof value === "string" &&
  (DELIVERY_STATUSES as readonly string[]).includes(value);

export const canTransitionDeliveryStatus = (
  currentStatus: DeliveryStatus,
  nextStatus: DeliveryStatus,
): boolean => DELIVERY_TRANSITIONS[currentStatus].includes(nextStatus);
