import { Router, type RequestHandler } from 'express';

import {
  createAccessToken,
  createWholesalerSignupToken,
} from "../../modules/auth/jwt/access-token-service.js";
import {
  WholesalerAuthenticationService,
  type WholesalerVerificationOutcome,
} from '../../modules/auth/wholesaler/wholesaler-authentication-service.js';
import { verifyWholesalerSignupToken } from '../../modules/auth/wholesaler/wholesaler-signup-token-service.js';
import { prisma } from '../../database/prisma.js';

const isValidPhoneNumber = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.length <= 20;

const isValidOtp = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{6}$/.test(value);

const isValidText = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.length <= maxLength;

type WholesalerAuthDependencies = {
  authenticationService: Pick<
    WholesalerAuthenticationService,
    'requestOtp' | 'verifyOtp'
  >;
  issueAccessToken: (
  wholesalerId: bigint,
  tokenType: 'WHOLESALER',
) => Promise<string>;
  issueSignupToken: (phoneNumber: string) => Promise<string>;
  verifySignupToken: (token: string) => Promise<string | null>;
};

export const createWholesalerAuthHandlers = ({
  authenticationService = new WholesalerAuthenticationService(),
  issueAccessToken = createAccessToken,
  issueSignupToken = createWholesalerSignupToken,
  verifySignupToken = verifyWholesalerSignupToken,
}: Partial<WholesalerAuthDependencies> = {}) => {
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

    const expiresAt = await authenticationService.requestOtp(phoneNumber);

    response.status(201).json({
      message: 'OTP requested.',
      expiresAt: expiresAt.toISOString(),
    });
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

    const outcome: WholesalerVerificationOutcome =
      await authenticationService.verifyOtp(phoneNumber, otp);

    switch (outcome.result) {
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
        if (outcome.isNewWholesaler) {
          response.status(200).json({
            verified: true,
            isNewWholesaler: true,
            signupToken: await issueSignupToken(phoneNumber),
          });
          return;
        }

        if (outcome.wholesalerId === undefined) {
          response.status(500).json({
            message: 'Wholesaler account could not be resolved.',
          });
          return;
        }

        response.status(200).json({
          verified: true,
          isNewWholesaler: false,
          accessToken: await issueAccessToken(
  outcome.wholesalerId,
  'WHOLESALER',
),
        });
        return;
    }
  };

  const signup: RequestHandler = async (request, response) => {
    const body = request.body as
      | {
          signupToken?: unknown;
          businessName?: unknown;
          ownerName?: unknown;
          address?: unknown;
          city?: unknown;
          pincode?: unknown;
        }
      | undefined;

    if (typeof body?.signupToken !== 'string') {
      response.status(400).json({
        message: 'A signup token is required.',
      });
      return;
    }

    const phoneNumber = await verifySignupToken(body.signupToken);

    if (phoneNumber === null) {
      response.status(401).json({
        message: 'Invalid or expired signup token.',
      });
      return;
    }

    if (
      !isValidText(body.businessName, 255) ||
      !isValidText(body.ownerName, 255) ||
      !isValidText(body.address, 10000) ||
      !isValidText(body.city, 100) ||
      !isValidText(body.pincode, 10)
    ) {
      response.status(400).json({
        message: 'Valid wholesaler business details are required.',
      });
      return;
    }

    const existingWholesaler = await prisma.wholesaler.findUnique({
      where: { phoneNumber },
    });

    if (existingWholesaler !== null) {
      response.status(409).json({
        message: 'A wholesaler account already exists for this phone number.',
      });
      return;
    }

    const now = new Date();

    const wholesaler = await prisma.wholesaler.create({
      data: {
        phoneNumber,
        businessName: body.businessName.trim(),
        ownerName: body.ownerName.trim(),
        address: body.address.trim(),
        city: body.city.trim(),
        pincode: body.pincode.trim(),
        createdAt: now,
        updatedAt: now,
      },
    });

    const accessToken = await issueAccessToken(
  wholesaler.id,
  'WHOLESALER',
);
    response.status(201).json({
      id: Number(wholesaler.id),
      phoneNumber: wholesaler.phoneNumber,
      businessName: wholesaler.businessName,
      ownerName: wholesaler.ownerName,
      address: wholesaler.address,
      city: wholesaler.city,
      pincode: wholesaler.pincode,
      accessToken,
    });
  };

  return {
    requestOtp,
    verifyOtp,
    signup,
  };
};

export const createWholesalerAuthRouter = (
  dependencies: Partial<WholesalerAuthDependencies> = {},
) => {
  const {
    requestOtp,
    verifyOtp,
    signup,
  } = createWholesalerAuthHandlers(dependencies);

  const router = Router();

  router.post('/request-otp', requestOtp);
  router.post('/verify-otp', verifyOtp);
  router.post('/signup', signup);

  return router;
};
