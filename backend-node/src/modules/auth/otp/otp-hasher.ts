import bcrypt from 'bcrypt';

const BCRYPT_COST = 10;

export interface OtpHasher {
  hash(otp: string): Promise<string>;
  matches(otp: string, hash: string): Promise<boolean>;
}

export const bcryptOtpHasher: OtpHasher = {
  hash: (otp) => bcrypt.hash(otp, BCRYPT_COST),
  matches: (otp, hash) => bcrypt.compare(otp, hash),
};
