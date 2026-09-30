import type { PrismaClient } from '@prisma/client';

import { prisma } from '../../../database/prisma.js';
import {
  secureOtpCodeGenerator,
  type OtpCodeGenerator,
} from '../otp/otp-code-generator.js';
import {
  otpDelivery,
  type OtpDelivery,
} from '../otp/otp-delivery.js';
import {
  bcryptOtpHasher,
  type OtpHasher,
} from '../otp/otp-hasher.js';

const OTP_VALIDITY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type AdminVerificationResult =
  | 'VERIFIED'
  | 'INVALID_OTP'
  | 'OTP_UNAVAILABLE'
  | 'ATTEMPTS_EXHAUSTED'
  | 'ADMIN_NOT_FOUND';

export type AdminVerificationOutcome = {
  result: AdminVerificationResult;
  adminId?: bigint;
};

export class AdminAuthenticationService {
  constructor(
    private readonly database: PrismaClient = prisma,
    private readonly codeGenerator: OtpCodeGenerator = secureOtpCodeGenerator,
    private readonly hasher: OtpHasher = bcryptOtpHasher,
    private readonly delivery: OtpDelivery = otpDelivery,
  ) {}

  async requestOtp(phoneNumber: string): Promise<Date> {
    return this.database.$transaction(async (transaction) => {
      const now = new Date();

      const admin = await transaction.admin.findUnique({
        where: { phoneNumber },
      });

      if (admin === null) {
        throw new Error('ADMIN_NOT_FOUND');
      }

      await transaction.adminOtpVerification.updateMany({
        where: {
          adminId: admin.id,
          verified: false,
          expiresAt: { gt: now },
        },
        data: {
          expiresAt: now,
        },
      });

      const otp = this.codeGenerator.generate();
      const expiresAt = new Date(now.getTime() + OTP_VALIDITY_MS);
      const otpHash = await this.hasher.hash(otp);

      await transaction.adminOtpVerification.create({
        data: {
          adminId: admin.id,
          phoneNumber,
          otpHash,
          expiresAt,
          createdAt: now,
        },
      });

      await this.delivery.deliver(phoneNumber, otp);

      return expiresAt;
    });
  }

  async verifyOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<AdminVerificationOutcome> {
    return this.database.$transaction(async (transaction) => {
      const admin = await transaction.admin.findUnique({
        where: { phoneNumber },
        select: { id: true },
      });

      if (admin === null) {
        return { result: 'ADMIN_NOT_FOUND' };
      }

      const verification =
        await transaction.adminOtpVerification.findFirst({
          where: {
            adminId: admin.id,
            phoneNumber,
            verified: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

      if (verification === null) {
        return { result: 'OTP_UNAVAILABLE' };
      }

      if (verification.attemptCount >= MAX_ATTEMPTS) {
        return { result: 'ATTEMPTS_EXHAUSTED' };
      }

      if (!(await this.hasher.matches(otp, verification.otpHash))) {
        const attemptCount = verification.attemptCount + 1;

        await transaction.adminOtpVerification.update({
          where: {
            id: verification.id,
          },
          data: {
            attemptCount: {
              increment: 1,
            },
          },
        });

        return {
          result:
            attemptCount >= MAX_ATTEMPTS
              ? 'ATTEMPTS_EXHAUSTED'
              : 'INVALID_OTP',
        };
      }

      await transaction.adminOtpVerification.update({
        where: {
          id: verification.id,
        },
        data: {
          verified: true,
        },
      });

      return {
        result: 'VERIFIED',
        adminId: admin.id,
      };
    });
  }
}
