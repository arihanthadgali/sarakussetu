export const USER_ROLES = ["RETAILER", "WHOLESALER", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const isUserRole = (value: string): value is UserRole =>
  USER_ROLES.includes(value as UserRole);
