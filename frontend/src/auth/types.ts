export interface Customer {
  id: number;
  phoneNumber: string;
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