import { apiRequest } from "../api/client";
import type {
  OtpRequestResponse,
  Wholesaler,
  WholesalerOtpVerifyResponse,
} from "./types";

const WHOLESALER_AUTH_BASE = "/api/wholesaler/auth";

export function requestOtp(
  phoneNumber: string,
): Promise<OtpRequestResponse> {
  return apiRequest<OtpRequestResponse>(
    `${WHOLESALER_AUTH_BASE}/request-otp`,
    {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    },
  );
}

export function verifyOtp(
  phoneNumber: string,
  otp: string,
): Promise<WholesalerOtpVerifyResponse> {
  return apiRequest<WholesalerOtpVerifyResponse>(
    `${WHOLESALER_AUTH_BASE}/verify-otp`,
    {
      method: "POST",
      body: JSON.stringify({
        phoneNumber,
        otp,
      }),
    },
  );
}

export interface WholesalerSignupRequest {
  signupToken: string;
  businessName: string;
  ownerName: string;
  address: string;
  city: string;
  pincode: string;
}

export interface WholesalerSignupResponse {
  message: string;
  accessToken: string;
  wholesaler: Wholesaler;
}

export function signupWholesaler(
  request: WholesalerSignupRequest,
): Promise<WholesalerSignupResponse> {
  return apiRequest<WholesalerSignupResponse>(
    `${WHOLESALER_AUTH_BASE}/signup`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}