import { useState, type FormEvent } from "react";

import { apiRequest } from "../api/client";

interface AdminLoginProps {
  onOtpRequested: (phoneNumber: string) => void;
}

export default function AdminLogin({
  onOtpRequested,
}: AdminLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const normalizedPhoneNumber = phoneNumber.trim();

    if (!normalizedPhoneNumber) {
      setError("Enter your admin phone number.");
      return;
    }

    try {
      setLoading(true);

      await apiRequest<{ expiresAt: string }>(
        "/api/admin/auth/request-otp",
        {
          method: "POST",
          body: JSON.stringify({
            phoneNumber: normalizedPhoneNumber,
          }),
        },
      );

      onOtpRequested(normalizedPhoneNumber);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send OTP.",
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

        <h1>Admin Login</h1>

        <p className="muted">
          Sign in with your registered admin phone number.
        </p>

        <form
          onSubmit={submit}
          className="auth-form"
        >
          <label>
            Phone number

            <input
              value={phoneNumber}
              onChange={(event) =>
                setPhoneNumber(event.target.value)
              }
              placeholder="Enter phone number"
              autoComplete="tel"
              inputMode="tel"
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
            {loading ? "Sending OTP…" : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}