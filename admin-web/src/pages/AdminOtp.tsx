import { useState, type FormEvent } from "react";

import { apiRequest } from "../api/client";
import { useAuth } from "../auth/useAuth";

interface AdminOtpProps {
  phoneNumber: string;
  onBack: () => void;
}

export default function AdminOtp({
  phoneNumber,
  onBack,
}: AdminOtpProps) {
  const { login } = useAuth();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const result = await apiRequest<{
        verified: boolean;
        accessToken: string;
      }>("/api/admin/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber,
          otp,
        }),
      });

      login(result.accessToken);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to verify OTP.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">S</div>

        <p className="eyebrow">SARAKUSETU ADMIN</p>

        <h1>Verify OTP</h1>

        <p className="muted">
          Enter the six-digit code sent to {phoneNumber}.
        </p>

        <form
          onSubmit={submit}
          className="auth-form"
        >
          <label>
            OTP

            <input
              value={otp}
              onChange={(event) =>
                setOtp(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6),
                )
              }
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="otp-input"
            />
          </label>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Verifying…"
              : "Verify & Continue"}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={onBack}
          >
            Change phone number
          </button>
        </form>
      </div>
    </div>
  );
}