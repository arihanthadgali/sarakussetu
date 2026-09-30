import { Router, type RequestHandler } from 'express';

import {
  AdminAuthenticationService,
  type AdminVerificationOutcome,
} from '../../modules/auth/admin/admin-authentication-service.js';
import { createAdminAccessToken } from '../../modules/auth/jwt/access-token-service.js';

const isValidPhoneNumber = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 20;

const isValidOtp = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{6}$/.test(value);

type AdminAuthDependencies = {
  authenticationService: Pick<AdminAuthenticationService, 'requestOtp' | 'verifyOtp'>;
  createAccessToken: (adminId: bigint) => Promise<string>;
};

const outcomeResponse = async (
  outcome: AdminVerificationOutcome,
  issueAccessToken: (adminId: bigint) => Promise<string>,
) => {
  switch (outcome.result) {
    case 'VERIFIED':
      return {
        status: 200,
        body: {
          verified: true,
          message: 'OTP verified.',
          accessToken: await issueAccessToken(outcome.adminId!),
        },
      };
    case 'INVALID_OTP':
      return { status: 400, body: { message: 'Invalid OTP.' } };
    case 'OTP_UNAVAILABLE':
      return { status: 400, body: { message: 'OTP is expired or unavailable.' } };
    case 'ATTEMPTS_EXHAUSTED':
      return { status: 429, body: { message: 'Maximum verification attempts exceeded.' } };
    case 'ADMIN_NOT_FOUND':
      return { status: 404, body: { message: 'Admin account not found.' } };
  }

  throw new Error('Unsupported admin OTP verification outcome.');
};

export const createAdminAuthHandlers = ({
  authenticationService = new AdminAuthenticationService(),
  createAccessToken: issueAccessToken = createAdminAccessToken,
}: Partial<AdminAuthDependencies> = {}) => {
  const requestOtp: RequestHandler = async (request, response, next) => {
    const phoneNumber = (request.body as { phoneNumber?: unknown } | undefined)?.phoneNumber;

    if (!isValidPhoneNumber(phoneNumber)) {
      response.status(400).json({ message: 'A phone number is required.' });
      return;
    }

    try {
      const expiresAt = await authenticationService.requestOtp(phoneNumber);
      response.status(201).json({
        message: 'OTP requested.',
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'ADMIN_NOT_FOUND') {
        response.status(404).json({ message: 'Admin account not found.' });
        return;
      }

      next(error);
    }
  };

  const verifyOtp: RequestHandler = async (request, response, next) => {
    const body = request.body as { phoneNumber?: unknown; otp?: unknown } | undefined;
    const phoneNumber = body?.phoneNumber;
    const otp = body?.otp;

    if (!isValidPhoneNumber(phoneNumber) || !isValidOtp(otp)) {
      response.status(400).json({ message: 'A phone number and six-digit OTP are required.' });
      return;
    }

    try {
      const outcome = await authenticationService.verifyOtp(phoneNumber, otp);
      const result = await outcomeResponse(outcome, issueAccessToken);
      response.status(result.status).json(result.body);
    } catch (error) {
      next(error);
    }
  };

  return { requestOtp, verifyOtp };
};

export const createAdminAuthRouter = (dependencies: Partial<AdminAuthDependencies> = {}) => {
  const { requestOtp, verifyOtp } = createAdminAuthHandlers(dependencies);
  const router = Router();

  router.post('/request-otp', requestOtp);
  router.post('/verify-otp', verifyOtp);

  return router;
};
