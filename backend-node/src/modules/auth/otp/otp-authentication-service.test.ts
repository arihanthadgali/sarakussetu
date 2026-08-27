import type { PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import {
  OtpAuthenticationService,
} from './otp-authentication-service.js';

const createService = (verification: Record<string, unknown> | null = null) => {
  const transaction = {
    customer: {
      create: vi.fn().mockResolvedValue({ id: 7n }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    otpVerification: {
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(verification),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  const database = {
    $transaction: vi.fn(async (callback: (client: typeof transaction) => unknown) => callback(transaction)),
  } as unknown as PrismaClient;
  const codeGenerator = { generate: vi.fn().mockReturnValue('123456') };
  const hasher = {
    hash: vi.fn().mockResolvedValue('$2b$10$hashed-otp'),
    matches: vi.fn().mockResolvedValue(false),
  };
  const delivery = { deliver: vi.fn().mockResolvedValue(undefined) };

  return {
    service: new OtpAuthenticationService(database, codeGenerator, hasher, delivery),
    transaction,
    codeGenerator,
    hasher,
    delivery,
  };
};

describe('OtpAuthenticationService', () => {
  it('creates a customer, expires active OTPs, hashes the code, and delivers it', async () => {
    const { service, transaction, hasher, delivery } = createService();

    const expiresAt = await service.requestOtp('+919876543210');

    expect(transaction.customer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ phoneNumber: '+919876543210' }),
    });
    expect(transaction.otpVerification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(Object) }),
    );
    expect(hasher.hash).toHaveBeenCalledWith('123456');
    expect(transaction.otpVerification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 7n,
        otpHash: '$2b$10$hashed-otp',
        phoneNumber: '+919876543210',
      }),
    });
    expect(delivery.deliver).toHaveBeenCalledWith('+919876543210', '123456');
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('reports unavailable when no current OTP exists', async () => {
    const { service } = createService();

    await expect(service.verifyOtp('+919876543210', '123456')).resolves.toEqual({
      result: 'OTP_UNAVAILABLE',
    });
  });

  it('records an invalid attempt and exhausts the fifth attempt', async () => {
    const { service, transaction, hasher } = createService({
      id: 4n,
      customerId: 7n,
      otpHash: '$2b$10$hashed-otp',
      attemptCount: 4,
    });

    await expect(service.verifyOtp('+919876543210', '000000')).resolves.toEqual({
      result: 'ATTEMPTS_EXHAUSTED',
    });
    expect(hasher.matches).toHaveBeenCalledWith('000000', '$2b$10$hashed-otp');
    expect(transaction.otpVerification.update).toHaveBeenCalledWith({
      where: { id: 4n },
      data: { attemptCount: { increment: 1 } },
    });
  });

  it('marks a matching OTP as verified and returns its customer ID', async () => {
    const { service, transaction, hasher } = createService({
      id: 4n,
      customerId: 7n,
      otpHash: '$2b$10$hashed-otp',
      attemptCount: 0,
    });
    hasher.matches.mockResolvedValueOnce(true);

    await expect(service.verifyOtp('+919876543210', '123456')).resolves.toEqual({
      result: 'VERIFIED',
      customerId: 7n,
    });
    expect(transaction.otpVerification.update).toHaveBeenCalledWith({
      where: { id: 4n },
      data: { verified: true },
    });
  });
});
