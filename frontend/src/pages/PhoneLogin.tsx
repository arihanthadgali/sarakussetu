import { useState, type FormEvent } from "react";

import { requestOtp } from "../auth/authApi";

interface PhoneLoginProps {
  onOtpRequested: (phoneNumber: string) => void;
}

export function PhoneLogin({ onOtpRequested }: PhoneLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPhone = phoneNumber.trim();

    if (!/^\d{10}$/.test(normalizedPhone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await requestOtp(normalizedPhone);
      onOtpRequested(normalizedPhone);
    } catch {
      setError("Unable to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-icon">✦</div>

      <span className="auth-label">WELCOME</span>

      <h2>Let's get started</h2>

      <p className="auth-description">
        Enter your phone number and we'll send you a secure one-time password.
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="phoneNumber">Mobile number</label>

        <div className={`phone-input ${error ? "input-error" : ""}`}>
          <span className="country-code">+91</span>

          <span className="input-divider" />

          <input
            id="phoneNumber"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
            value={phoneNumber}
            onChange={(event) =>
              setPhoneNumber(event.target.value.replace(/\D/g, ""))
            }
            placeholder="Enter mobile number"
            disabled={isLoading}
            autoFocus
          />
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="button-spinner" />
              Sending OTP...
            </>
          ) : (
            <>
              Continue
              <span className="button-arrow">→</span>
            </>
          )}
        </button>
      </form>

      <p className="terms">
        By continuing, you agree to our{" "}
        <span>Terms of Service</span> and <span>Privacy Policy</span>.
      </p>
    </div>
  );
}