import type { PrismaClient } from '@prisma/client';

import { prisma } from '../../../database/prisma.js';
import { secureOtpCodeGenerator, type OtpCodeGenerator } from './otp-code-generator.js';
import { otpDelivery, type OtpDelivery } from './otp-delivery.js';
import { bcryptOtpHasher, type OtpHasher } from './otp-hasher.js';

const OTP_VALIDITY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type VerificationResult =
  | 'VERIFIED'
  | 'INVALID_OTP'
  | 'OTP_UNAVAILABLE'
  | 'ATTEMPTS_EXHAUSTED';

export type VerificationOutcome = {
  result: VerificationResult;
  customerId?: bigint;
};

export class OtpAuthenticationService {
  constructor(
    private readonly database: PrismaClient = prisma,
    private readonly codeGenerator: OtpCodeGenerator = secureOtpCodeGenerator,
    private readonly hasher: OtpHasher = bcryptOtpHasher,
    private readonly delivery: OtpDelivery = otpDelivery,
  ) {}

  async requestOtp(phoneNumber: string): Promise<Date> {
    return this.database.$transaction(async (transaction) => {
      const now = new Date();
      const existingCustomer = await transaction.customer.findUnique({ where: { phoneNumber } });
      const customer =
        existingCustomer ??
        (await transaction.customer.create({
          data: { phoneNumber, createdAt: now, updatedAt: now },
        }));

      await transaction.otpVerification.updateMany({
        where: {
          customerId: customer.id,
          verified: false,
          expiresAt: { gt: now },
        },
        data: { expiresAt: now },
      });

      const otp = this.codeGenerator.generate();
      const expiresAt = new Date(now.getTime() + OTP_VALIDITY_MS);
      const otpHash = await this.hasher.hash(otp);

      await transaction.otpVerification.create({
        data: {
          customerId: customer.id,
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

  async verifyOtp(phoneNumber: string, otp: string): Promise<VerificationOutcome> {
    return this.database.$transaction(async (transaction) => {
      const verification = await transaction.otpVerification.findFirst({
        where: {
          phoneNumber,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (verification === null) {
        return { result: 'OTP_UNAVAILABLE' };
      }
      if (verification.attemptCount >= MAX_ATTEMPTS) {
        return { result: 'ATTEMPTS_EXHAUSTED' };
      }
      if (!(await this.hasher.matches(otp, verification.otpHash))) {
        const attemptCount = verification.attemptCount + 1;
        await transaction.otpVerification.update({
          where: { id: verification.id },
          data: { attemptCount: { increment: 1 } },
        });
        return {
          result: attemptCount >= MAX_ATTEMPTS ? 'ATTEMPTS_EXHAUSTED' : 'INVALID_OTP',
        };
      }

      await transaction.otpVerification.update({
        where: { id: verification.id },
        data: { verified: true },
      });
      return { result: 'VERIFIED', customerId: verification.customerId };
    });
  }
}
