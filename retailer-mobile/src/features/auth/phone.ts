/**
 * The backend does not normalise phone numbers, and the retailer web app sends
 * 10 bare digits. Sending any other form (e.g. +91…) would create a second
 * customer for the same shop, so the app never adds a country code.
 */
export const PHONE_LENGTH = 10;
export const OTP_LENGTH = 6;

/**
 * Keeps digits only, capped at 10. Use on every keystroke.
 *
 * If the retailer types or pastes a country code or trunk zero
 * ("+91 98765 43210", "919876543210", "09876543210") it is removed, so the
 * value is still the 10 bare digits the backend expects. The app never
 * *adds* a prefix. A plain 10-digit number starting with 91 is untouched.
 */
export function sanitizePhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (/^\s*\+\s*91/.test(value)) digits = digits.slice(2);
  else if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, PHONE_LENGTH);
}

export function isValidPhoneNumber(value: string): boolean {
  return /^\d{10}$/.test(value);
}

export function sanitizeOtpInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function isValidOtp(value: string): boolean {
  return /^\d{6}$/.test(value);
}

/** 9876543210 -> "98765 43210" for display only. */
export function formatPhoneForDisplay(value: string): string {
  return value.length === PHONE_LENGTH ? `${value.slice(0, 5)} ${value.slice(5)}` : value;
}
