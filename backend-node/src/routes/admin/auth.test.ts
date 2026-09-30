import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { createAdminAccessToken } from '../../modules/auth/jwt/access-token-service.js';
import { requireAdminAuthentication } from '../../middleware/admin-authentication.js';
import { requireAuthentication } from '../../middleware/authentication.js';
import { createAdminAuthHandlers } from './auth.js';

const createResponse = () => {
  const response = { json: vi.fn(), locals: {}, status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response;
};

const createAuthenticationService = () => ({
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
});

describe('admin authentication routes', () => {
  it('requests an OTP using the frontend response contract', async () => {
    const authenticationService = createAuthenticationService();
    authenticationService.requestOtp.mockResolvedValue(new Date('2026-01-01T00:05:00.000Z'));
    const { requestOtp } = createAdminAuthHandlers({ authenticationService });
    const response = createResponse();

    await requestOtp(
      { body: { phoneNumber: '+919876543210' } } as Request,
      response,
      vi.fn(),
    );

    expect(authenticationService.requestOtp).toHaveBeenCalledWith('+919876543210');
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith({
      message: 'OTP requested.',
      expiresAt: '2026-01-01T00:05:00.000Z',
    });
  });

  it('returns a not-found response when the admin does not exist', async () => {
    const authenticationService = createAuthenticationService();
    authenticationService.requestOtp.mockRejectedValue(new Error('ADMIN_NOT_FOUND'));
    const { requestOtp } = createAdminAuthHandlers({ authenticationService });
    const response = createResponse();

    await requestOtp(
      { body: { phoneNumber: '+919876543210' } } as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      message: 'Admin account not found.',
    });
  });

  it.each([
    ['INVALID_OTP', 400, 'Invalid OTP.'],
    ['OTP_UNAVAILABLE', 400, 'OTP is expired or unavailable.'],
    ['ATTEMPTS_EXHAUSTED', 429, 'Maximum verification attempts exceeded.'],
    ['ADMIN_NOT_FOUND', 404, 'Admin account not found.'],
  ] as const)('returns the expected response for %s', async (result, status, message) => {
    const authenticationService = createAuthenticationService();
    authenticationService.verifyOtp.mockResolvedValue({ result });
    const { verifyOtp } = createAdminAuthHandlers({ authenticationService });
    const response = createResponse();

    await verifyOtp(
      { body: { phoneNumber: '+919876543210', otp: '123456' } } as Request,
      response,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({ message });
  });

  it('returns an access token after successful verification', async () => {
    const authenticationService = createAuthenticationService();
    const createAccessToken = vi.fn().mockResolvedValue('admin-token');
    authenticationService.verifyOtp.mockResolvedValue({ result: 'VERIFIED', adminId: 7n });
    const { verifyOtp } = createAdminAuthHandlers({ authenticationService, createAccessToken });
    const response = createResponse();

    await verifyOtp(
      { body: { phoneNumber: '+919876543210', otp: '123456' } } as Request,
      response,
      vi.fn(),
    );

    expect(createAccessToken).toHaveBeenCalledWith(7n);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      verified: true,
      message: 'OTP verified.',
      accessToken: 'admin-token',
    });
  });

  it('issues a token accepted by the existing admin authentication middleware', async () => {
    const token = await createAdminAccessToken(7n);
    const response = createResponse();
    const request = {
      get: vi.fn().mockReturnValue(`Bearer ${token}`),
    } as unknown as Request;
    const authenticationNext = vi.fn();

    await requireAuthentication(request, response, authenticationNext);

    expect(authenticationNext).toHaveBeenCalledOnce();
    expect(response.locals).toEqual(
      expect.objectContaining({ adminId: 7n, role: 'ADMIN' }),
    );

    const adminNext = vi.fn();
    requireAdminAuthentication(request, response, adminNext);

    expect(adminNext).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
  });
});
