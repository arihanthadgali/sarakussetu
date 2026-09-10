import { useState, type FormEvent } from "react";

import { verifyOtp } from "../auth/authApi";
import { useAuth } from "../auth/useAuth";
interface OtpVerificationProps {
  phoneNumber: string;
  onBack: () => void;
  onVerified?: () => void | Promise<void>;
}

export function OtpVerification({
  phoneNumber,
  onBack,
  onVerified,
}: OtpVerificationProps) {
  const { login } = useAuth();

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await verifyOtp(phoneNumber, otp);

      if (!response.verified || !response.accessToken) {
        throw new Error("OTP verification failed.");
      }

      await login(response.accessToken);

      if (onVerified) {
        await onVerified();
      }
    } catch {
      setError("Invalid or expired OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const maskedPhone = `+91 ${phoneNumber.slice(0, 2)}******${phoneNumber.slice(-2)}`;

  return (
    <div className="auth-card">
      <button
        className="back-button"
        type="button"
        onClick={onBack}
        disabled={isLoading}
      >
        ← Back
      </button>

      <div className="auth-card-icon otp-icon">✓</div>

      <span className="auth-label">VERIFY</span>

      <h2>Check your phone</h2>

      <p className="auth-description">
        We've sent a 6-digit verification code to{" "}
        <strong>{maskedPhone}</strong>
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="otp">Verification code</label>

        <input
          className={`otp-input ${error ? "input-error" : ""}`}
          id="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          value={otp}
          onChange={(event) =>
            setOtp(event.target.value.replace(/\D/g, ""))
          }
          placeholder="000000"
          disabled={isLoading}
          autoFocus
        />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="button-spinner" />
              Verifying...
            </>
          ) : (
            <>
              Verify & continue
              <span className="button-arrow">→</span>
            </>
          )}
        </button>
      </form>

      <p className="otp-help">
        Didn't receive the code? <span>Try again</span>
      </p>
    </div>
  );
}