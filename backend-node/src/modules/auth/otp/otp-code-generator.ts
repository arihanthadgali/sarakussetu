import { randomInt } from 'node:crypto';

const OTP_BOUND = 1_000_000;

export interface OtpCodeGenerator {
  generate(): string;
}

export const secureOtpCodeGenerator: OtpCodeGenerator = {
  generate: () => randomInt(OTP_BOUND).toString().padStart(6, '0'),
};
