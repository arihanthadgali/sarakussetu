import { apiRequest } from "../api/client";
import type { OtpRequestResponse, OtpVerifyResponse } from "./types";

export function requestOtp(
  phoneNumber: string,
): Promise<OtpRequestResponse> {
  return apiRequest<OtpRequestResponse>("/api/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  });
}

export function verifyOtp(
  phoneNumber: string,
  otp: string,
): Promise<OtpVerifyResponse> {
  return apiRequest<OtpVerifyResponse>("/api/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, otp }),
  });
}