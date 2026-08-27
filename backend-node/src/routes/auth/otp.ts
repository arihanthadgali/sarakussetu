import { Router, type RequestHandler } from 'express';

import { createAccessToken } from '../../modules/auth/jwt/access-token-service.js';
import {
  OtpAuthenticationService,
  type VerificationOutcome,
} from '../../modules/auth/otp/otp-authentication-service.js';

const isValidPhoneNumber = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 20;

const isValidOtp = (value: unknown): value is string => typeof value === 'string' && /^\d{6}$/.test(value);

type OtpHandlersDependencies = {
  authenticationService: Pick<OtpAuthenticationService, 'requestOtp' | 'verifyOtp'>;
  createAccessToken: (customerId: bigint) => Promise<string>;
};

const outcomeResponse = async (
  outcome: VerificationOutcome,
  issueAccessToken: (customerId: bigint) => Promise<string>,
) => {
  switch (outcome.result) {
    case 'VERIFIED':
      return {
        status: 200,
        body: {
          verified: true,
          message: 'OTP verified.',
          accessToken: await issueAccessToken(outcome.customerId!),
        },
      };
    case 'INVALID_OTP':
      return { status: 400, body: { message: 'Invalid OTP.' } };
    case 'OTP_UNAVAILABLE':
      return { status: 400, body: { message: 'OTP is expired or unavailable.' } };
    case 'ATTEMPTS_EXHAUSTED':
      return { status: 429, body: { message: 'Maximum verification attempts exceeded.' } };
  }
};

export const createOtpHandlers = ({
  authenticationService = new OtpAuthenticationService(),
  createAccessToken: issueAccessToken = createAccessToken,
}: Partial<OtpHandlersDependencies> = {}) => {
  const requestOtp: RequestHandler = async (request, response) => {
    const phoneNumber = (request.body as { phoneNumber?: unknown } | undefined)?.phoneNumber;
    if (!isValidPhoneNumber(phoneNumber)) {
      response.status(400).json({ message: 'A phone number is required.' });
      return;
    }

    const expiresAt = await authenticationService.requestOtp(phoneNumber);
    response.status(201).json({ message: 'OTP requested.', expiresAt: expiresAt.toISOString() });
  };

  const verifyOtp: RequestHandler = async (request, response) => {
    const body = request.body as { phoneNumber?: unknown; otp?: unknown } | undefined;
    const phoneNumber = body?.phoneNumber;
    const otp = body?.otp;
    if (!isValidPhoneNumber(phoneNumber) || !isValidOtp(otp)) {
      response.status(400).json({ message: 'A phone number and six-digit OTP are required.' });
      return;
    }

    const outcome = await authenticationService.verifyOtp(phoneNumber, otp);
    const result = await outcomeResponse(outcome, issueAccessToken);
    response.status(result.status).json(result.body);
  };

  return { requestOtp, verifyOtp };
};

export const createOtpRouter = (dependencies: Partial<OtpHandlersDependencies> = {}) => {
  const { requestOtp, verifyOtp } = createOtpHandlers(dependencies);
  const router = Router();
  router.post('/request', requestOtp);
  router.post('/verify', verifyOtp);
  return router;
};
