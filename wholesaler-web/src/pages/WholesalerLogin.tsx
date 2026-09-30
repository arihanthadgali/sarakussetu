import { useState } from "react";

import { requestOtp } from "../auth/authApi";

import "./WholesalerLogin.css";

interface WholesalerLoginProps {
  mode: "signin" | "register";
  onOtpRequested: (phoneNumber: string, mode: "signin" | "register") => void;
  onChangeMode: (mode: "signin" | "register") => void;
}

export default function WholesalerLogin({
  mode,
  onOtpRequested,
  onChangeMode,
}: WholesalerLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegistering = mode === "register";

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const normalizedPhone = phoneNumber.replace(/\D/g, "");

    if (normalizedPhone.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      await requestOtp(normalizedPhone);

      onOtpRequested(normalizedPhone, mode);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to send OTP.",
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

        <h1>
          {isRegistering
            ? "Create Wholesaler Account"
            : "Wholesaler Portal"}
        </h1>

        <p>
          {isRegistering
            ? "Create your account to receive and prepare retailer orders."
            : "Sign in to manage retailer orders and prepare them for pickup."}
        </p>

        <div className="auth-mode-switch">
          <button
            type="button"
            className={!isRegistering ? "active" : ""}
            onClick={() => onChangeMode("signin")}
          >
            Sign In
          </button>

          <button
            type="button"
            className={isRegistering ? "active" : ""}
            onClick={() => onChangeMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="phoneNumber">
            Mobile number
          </label>

          <input
            id="phoneNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Enter mobile number"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            disabled={isLoading}
          />

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Sending OTP..." : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}