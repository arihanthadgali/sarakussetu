export type UserRole =
  | "RETAILER"
  | "WHOLESALER"
  | "ADMIN";

export interface Customer {
  id: number;
  phoneNumber: string;
  role: UserRole;
}

export interface OtpRequestResponse {
  message: string;
  expiresAt: string;
}

export interface OtpVerifyResponse {
  verified: boolean;
  message: string;
  accessToken: string;
}