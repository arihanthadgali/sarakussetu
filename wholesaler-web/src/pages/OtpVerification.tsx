import { useState } from "react";

import { verifyOtp } from "../auth/authApi";

import "./OtpVerification.css";

interface OtpVerificationProps {
  phoneNumber: string;
  mode: "signin" | "register";
  onBack: () => void;
  onVerified: (token: string) => Promise<void> | void;
  onSignupRequired: (signupToken: string) => void;
}

export default function OtpVerification({
  phoneNumber,
  mode,
  onBack,
  onVerified,
  onSignupRequired,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const normalizedOtp = otp.replace(/\D/g, "");

    if (normalizedOtp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const result = await verifyOtp(
        phoneNumber,
        normalizedOtp,
      );

      if (result.accessToken) {
        await onVerified(result.accessToken);
        return;
      }

      if (result.signupToken) {
        onSignupRequired(result.signupToken);
        return;
      }

      throw new Error(
        result.message || "OTP verification failed.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to verify OTP.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="wholesaler-auth-page">
      <section className="wholesaler-auth-card">
        <div className="wholesaler-auth-kicker">
          SARAKUSETU
        </div>

        <h1>Verify OTP</h1>

        <p>
          Enter the OTP sent to <strong>{phoneNumber}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="otp">OTP</label>

          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            disabled={isLoading}
          />

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            className="back-button"
            type="button"
            onClick={onBack}
            disabled={isLoading}
          >
            ← Change number
          </button>
        </form>

        <small>
          {mode === "register"
            ? "After verification, you'll enter your business details."
            : "You'll be taken to your dashboard after verification."}
        </small>
      </section>
    </main>
  );
}