import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { createOtpHandlers } from './otp.js';

const createResponse = () => {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

describe('OTP routes', () => {
  it('preserves the request response contract', async () => {
    const authenticationService = {
      requestOtp: vi.fn().mockResolvedValue(new Date('2026-01-01T00:05:00.000Z')),
      verifyOtp: vi.fn(),
    };
    const { requestOtp } = createOtpHandlers({ authenticationService });
    const response = createResponse();

    await requestOtp({ body: { phoneNumber: '+919876543210' } } as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
      message: 'OTP requested.',
      expiresAt: '2026-01-01T00:05:00.000Z',
    });
  });

  it('returns the JWT-bearing verified response contract', async () => {
    const authenticationService = {
      requestOtp: vi.fn(),
      verifyOtp: vi.fn().mockResolvedValue({ result: 'VERIFIED', customerId: 7n }),
    };
    const createAccessToken = vi.fn().mockResolvedValue('signed-token');
    const { verifyOtp } = createOtpHandlers({ authenticationService, createAccessToken });
    const response = createResponse();

    await verifyOtp(
      { body: { phoneNumber: '+919876543210', otp: '123456' } } as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      verified: true,
      message: 'OTP verified.',
      accessToken: 'signed-token',
    });
  });

  it('rejects malformed verification input', async () => {
    const authenticationService = { requestOtp: vi.fn(), verifyOtp: vi.fn() };
    const { verifyOtp } = createOtpHandlers({ authenticationService });
    const response = createResponse();

    await verifyOtp({ body: { phoneNumber: '', otp: '1' } } as Request, response, vi.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: 'A phone number and six-digit OTP are required.',
    });
  });
});
