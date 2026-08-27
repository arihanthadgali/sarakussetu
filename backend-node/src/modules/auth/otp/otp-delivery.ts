import { env } from '../../../config/env.js';

export interface OtpDelivery {
  deliver(phoneNumber: string, otp: string): Promise<void>;
}

export const otpDelivery: OtpDelivery = {
  deliver: async (phoneNumber, otp) => {
    if (env.NODE_ENV === 'development') {
      console.info(`Development OTP for ${phoneNumber}: ${otp}`);
    }
  },
};
