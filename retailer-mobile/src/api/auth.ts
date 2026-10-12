/**
 * Retailer authentication — existing backend endpoints only.
 * Source: backend-node/src/routes/auth/otp.ts and routes/auth/me.ts
 */
import { z } from 'zod';

import { apiRequest } from './client';

export const otpRequestResponseSchema = z.object({
  message: z.string(),
  expiresAt: z.string(),
});

export const otpVerifyResponseSchema = z.object({
  verified: z.literal(true),
  message: z.string(),
  accessToken: z.string().min(1),
});

/** GET /api/auth/me returns only these two fields (id is a string). */
export const currentCustomerSchema = z.object({
  id: z.string(),
  phoneNumber: z.string(),
});

export type OtpRequestResponse = z.infer<typeof otpRequestResponseSchema>;
export type OtpVerifyResponse = z.infer<typeof otpVerifyResponseSchema>;
export type CurrentCustomer = z.infer<typeof currentCustomerSchema>;

/** POST /api/auth/otp/request — 201. Creates the customer if the number is new. */
export function requestOtp(phoneNumber: string): Promise<OtpRequestResponse> {
  return apiRequest('/api/auth/otp/request', {
    method: 'POST',
    body: { phoneNumber },
    schema: otpRequestResponseSchema,
  });
}

/**
 * POST /api/auth/otp/verify — 200 with accessToken.
 * 400 "Invalid OTP." / "OTP is expired or unavailable." · 429 after 5 attempts.
 */
export function verifyOtp(phoneNumber: string, otp: string): Promise<OtpVerifyResponse> {
  return apiRequest('/api/auth/otp/verify', {
    method: 'POST',
    body: { phoneNumber, otp },
    schema: otpVerifyResponseSchema,
  });
}

/** GET /api/auth/me — 401 when the token is missing, invalid or expired. */
export function getCurrentCustomer(): Promise<CurrentCustomer> {
  return apiRequest('/api/auth/me', { auth: true, schema: currentCustomerSchema });
}
