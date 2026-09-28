import { useState } from "react";

import { signupWholesaler } from "../auth/authApi";

interface WholesalerSignupProps {
  signupToken: string;
  onCompleted: (accessToken: string) => Promise<void> | void;
  onBack: () => void;
}

export default function WholesalerSignup({
  signupToken,
  onCompleted,
  onBack,
}: WholesalerSignupProps) {
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!businessName.trim()) {
      setError("Enter the business name.");
      return;
    }

    if (!ownerName.trim()) {
      setError("Enter the owner's name.");
      return;
    }

    if (!address.trim()) {
      setError("Enter the business address.");
      return;
    }

    if (!city.trim()) {
      setError("Enter the city.");
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const result = await signupWholesaler({
        signupToken,
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
      });

      await onCompleted(result.accessToken);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create account.",
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

        <h1>Business Details</h1>

        <p>
          Complete your wholesaler profile to create your account.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="businessName">
            Business name
          </label>

          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            disabled={isLoading}
          />

          <label htmlFor="ownerName">
            Owner name
          </label>

          <input
            id="ownerName"
            type="text"
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            disabled={isLoading}
          />

          <label htmlFor="address">
            Address
          </label>

          <textarea
            id="address"
            rows={4}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            disabled={isLoading}
          />

          <label htmlFor="city">
            City
          </label>

          <input
            id="city"
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            disabled={isLoading}
          />

          <label htmlFor="pincode">
            Pincode
          </label>

          <input
            id="pincode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(event) =>
              setPincode(event.target.value.replace(/\D/g, ""))
            }
            disabled={isLoading}
          />

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <button
            className="back-button"
            type="button"
            onClick={onBack}
            disabled={isLoading}
          >
            ← Back
          </button>
        </form>
      </section>
    </main>
  );
}
