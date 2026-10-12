import { formatPhoneForDisplay, isValidOtp, isValidPhoneNumber, sanitizeOtpInput, sanitizePhoneInput } from './phone';

describe('phone input', () => {
  it('keeps 10 bare digits and never adds a country code', () => {
    expect(sanitizePhoneInput('98765 43210')).toBe('9876543210');
  });
  it('removes a country code or trunk zero the user typed or pasted', () => {
    expect(sanitizePhoneInput('+91 98765-43210')).toBe('9876543210');
    expect(sanitizePhoneInput('919876543210')).toBe('9876543210');
    expect(sanitizePhoneInput('09876543210')).toBe('9876543210');
  });
  it('leaves a 10-digit number that starts with 91 alone', () => {
    expect(sanitizePhoneInput('9198765432')).toBe('9198765432');
  });
  it('validates exactly 10 digits', () => {
    expect(isValidPhoneNumber('9876543210')).toBe(true);
    expect(isValidPhoneNumber('919876543210')).toBe(false);
    expect(isValidPhoneNumber('98765')).toBe(false);
  });
  it('formats for display only', () => expect(formatPhoneForDisplay('9876543210')).toBe('98765 43210'));
});

describe('otp input', () => {
  it('keeps 6 digits', () => expect(sanitizeOtpInput('12a34567')).toBe('123456'));
  it('validates 6 digits', () => {
    expect(isValidOtp('123456')).toBe(true);
    expect(isValidOtp('12345')).toBe(false);
  });
});
