export type UserRole =
  | "RETAILER"
  | "WHOLESALER"
  | "ADMIN";

export interface Wholesaler {
  id: number;
  phoneNumber: string;
  businessName: string;
  ownerName: string;
  address: string;
  city: string;
  pincode: string;
}

export interface OtpRequestResponse {
  message: string;
  expiresAt: string;
}

export interface WholesalerOtpVerifyResponse {
  verified: boolean;
  message: string;
  accessToken?: string;
  signupToken?: string;
  isNewWholesaler?: boolean;
}