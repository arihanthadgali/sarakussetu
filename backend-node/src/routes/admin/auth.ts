import { Router, type RequestHandler } from 'express';


import { createAccessToken } from '../../modules/auth/jwt/access-token-service.js';
import {
  AdminAuthenticationService,
  type AdminVerificationOutcome,
} from '../../modules/auth/admin/admin-authentication-service.js';

const isValidPhoneNumber = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.length <= 20;

const isValidOtp = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{6}$/.test(value);

type AdminAuthDependencies = {
  authenticationService: Pick<
    AdminAuthenticationService,
    'requestOtp' | 'verifyOtp'
  >;
  issueAccessToken: (
    adminId: bigint,
    tokenType: 'ADMIN',
  ) => Promise<string>;
};

export const createAdminAuthHandlers = ({
  authenticationService = new AdminAuthenticationService(),
  issueAccessToken = createAccessToken,
}: Partial<AdminAuthDependencies> = {}) => {
  const requestOtp: RequestHandler = async (request, response) => {
    const phoneNumber = (
      request.body as { phoneNumber?: unknown } | undefined
    )?.phoneNumber;

    if (!isValidPhoneNumber(phoneNumber)) {
      response.status(400).json({
        message: 'A phone number is required.',
      });
      return;
    }

    try {
      const expiresAt =
        await authenticationService.requestOtp(phoneNumber);

      response.status(201).json({
        message: 'OTP requested.',
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'ADMIN_NOT_FOUND') {
        response.status(404).json({
          message: 'Admin account not found.',
        });
        return;
      }

      throw error;
    }
  };

  const verifyOtp: RequestHandler = async (request, response) => {
    const body = request.body as
      | {
          phoneNumber?: unknown;
          otp?: unknown;
        }
      | undefined;

    const phoneNumber = body?.phoneNumber;
    const otp = body?.otp;

    if (!isValidPhoneNumber(phoneNumber) || !isValidOtp(otp)) {
      response.status(400).json({
        message: 'A phone number and six-digit OTP are required.',
      });
      return;
    }

    const outcome: AdminVerificationOutcome =
      await authenticationService.verifyOtp(phoneNumber, otp);

    switch (outcome.result) {
      case 'ADMIN_NOT_FOUND':
        response.status(404).json({
          message: 'Admin account not found.',
        });
        return;

      case 'INVALID_OTP':
        response.status(400).json({
          message: 'Invalid OTP.',
        });
        return;

      case 'OTP_UNAVAILABLE':
        response.status(400).json({
          message: 'OTP is expired or unavailable.',
        });
        return;

      case 'ATTEMPTS_EXHAUSTED':
        response.status(429).json({
          message: 'Maximum verification attempts exceeded.',
        });
        return;

      case 'VERIFIED':
        if (outcome.adminId === undefined) {
          response.status(500).json({
            message: 'Admin account could not be resolved.',
          });
          return;
        }

        response.status(200).json({
          verified: true,
          accessToken: await issueAccessToken(
            outcome.adminId,
            'ADMIN',
          ),
        });
        return;
    }
  };

  return {
    requestOtp,
    verifyOtp,
  };
};

export const createAdminAuthRouter = (
  dependencies: Partial<AdminAuthDependencies> = {},
) => {
  const { requestOtp, verifyOtp } =
    createAdminAuthHandlers(dependencies);

  const router = Router();

  router.post('/request-otp', requestOtp);
  router.post('/verify-otp', verifyOtp);

  return router;
};
