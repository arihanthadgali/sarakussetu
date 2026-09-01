import { useState } from "react";
import type { SubmitEvent } from "react";

import "./App.css";

import { apiRequest } from "./api/client";
import { useAuth } from "./auth/useAuth";

import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import ProductCatalog from "./pages/ProductCatalog";

type OtpRequestResponse = {
  message: string;
  expiresAt: string;
};

type OtpVerifyResponse = {
  verified: boolean;
  message: string;
  accessToken: string;
};

function App() {
  const { customer, isAuthenticated, isLoading, login, logout } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showProducts, setShowProducts] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  const goHome = () => {
    setShowProducts(false);
    setShowCart(false);
    setShowOrders(false);
  };

  const openProducts = () => {
    setShowProducts(true);
    setShowCart(false);
    setShowOrders(false);
  };

  const openCart = () => {
    setShowProducts(false);
    setShowCart(true);
    setShowOrders(false);
  };

  const openOrders = () => {
    setShowProducts(false);
    setShowCart(false);
    setShowOrders(true);
  };

  async function handleRequestOtp(event: SubmitEvent) {
    event.preventDefault();

    const phone = phoneNumber.replace(/\D/g, "");

    if (phone.length !== 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await apiRequest<OtpRequestResponse>("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phoneNumber: phone }),
      });

      setPhoneNumber(phone);
      setStep("otp");
      setMessage("");
    } catch {
      setMessage("Unable to send OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: SubmitEvent) {
    event.preventDefault();

    if (otp.length !== 6) {
      setMessage("Please enter the 6-digit OTP.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await apiRequest<OtpVerifyResponse>(
        "/api/auth/otp/verify",
        {
          method: "POST",
          body: JSON.stringify({
            phoneNumber,
            otp,
          }),
        },
      );

      await login(response.accessToken);
    } catch {
      setMessage("Invalid or expired OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    setIsSubmitting(true);
    setMessage("");

    try {
      await apiRequest<OtpRequestResponse>("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      });

      setOtp("");
      setMessage("A new OTP has been sent.");
    } catch {
      setMessage("Unable to resend OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="loader" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (showProducts) {
      return (
        <main className="dashboard-page">
          <header className="site-header">
            <Brand onClick={goHome} />

            <div className="header-right">
              <div className="online-status">
                <span />
                Account active
              </div>

              <button
                className="header-button"
                type="button"
                onClick={goHome}
              >
                ← Back
              </button>

              <button
                className="header-button"
                type="button"
                onClick={openCart}
              >
                Cart
              </button>

              <button
                className="header-button"
                type="button"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </header>

          <ProductCatalog />
        </main>
      );
    }

    if (showCart) {
      return (
        <main className="dashboard-page">
          <header className="site-header">
            <Brand onClick={goHome} />

            <div className="header-right">
              <div className="online-status">
                <span />
                Account active
              </div>

              <button
                className="header-button"
                type="button"
                onClick={openProducts}
              >
                ← Products
              </button>

              <button
                className="header-button"
                type="button"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </header>

          <Cart />
        </main>
      );
    }

    if (showOrders) {
      return (
        <main className="dashboard-page">
          <header className="site-header">
            <Brand onClick={goHome} />

            <div className="header-right">
              <div className="online-status">
                <span />
                Account active
              </div>

              <button
                className="header-button"
                type="button"
                onClick={goHome}
              >
                ← Back
              </button>

              <button
                className="header-button"
                type="button"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </header>

          <Orders />
        </main>
      );
    }

    return (
      <main className="dashboard-page">
        <header className="site-header">
          <Brand onClick={goHome} />

          <div className="header-right">
            <div className="online-status">
              <span />
              Account active
            </div>

            <button
              className="header-button"
              type="button"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <div className="section-kicker">YOUR BUSINESS</div>

              <h1>
                Good to see you
                <span>.</span>
              </h1>

              <p>
                Everything you need to manage your wholesale purchases,
                orders and shop supplies.
              </p>
            </div>

            <div className="account-card">
              <div className="avatar">A</div>

              <div>
                <strong>Shop account</strong>
                <small>+91 {customer?.phoneNumber}</small>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div
              className={`dashboard-card ${
                showProducts ? "dashboard-primary" : ""
              }`}
            >
              <div className="card-top">
                <span className="card-icon">↗</span>
                <span>01</span>
              </div>

              <div>
                <small>PRODUCTS</small>

                <h2>Find what your shop needs.</h2>

                <p>
                  Browse products from your wholesale network and start
                  building your order.
                </p>
              </div>

              <button
                type="button"
                onClick={openProducts}
              >
                Browse products <span>→</span>
              </button>
            </div>

            <div
              className={`dashboard-card ${
                showOrders ? "dashboard-primary" : ""
              }`}
            >
              <div className="card-top">
                <span className="card-icon">↻</span>
                <span>02</span>
              </div>

              <div>
                <small>ORDERS</small>

                <h2>Keep track of every order.</h2>

                <p>
                  View previous purchases and follow your latest deliveries.
                </p>
              </div>

              <button
                type="button"
                onClick={openOrders}
              >
                View orders <span>→</span>
              </button>
            </div>

            <div
              className={`dashboard-card ${
                showCart ? "dashboard-primary" : ""
              }`}
            >
              <div className="card-top">
                <span className="card-icon">□</span>
                <span>03</span>
              </div>

              <div>
                <small>CART</small>

                <h2>Your next order starts here.</h2>

                <p>
                  Products you select will be ready for review before
                  checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={openCart}
              >
                View cart <span>→</span>
              </button>
            </div>
          </div>

          <div className="dashboard-strip">
            <div>
              <span className="strip-mark">S</span>

              <div>
                <strong>Wholesale to Your Shop</strong>

                <p>
                  A simpler connection between suppliers and retailers.
                </p>
              </div>
            </div>

            <span className="strip-arrow">→</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <header className="site-header">
        <Brand onClick={goHome} />

        <div className="header-right">
          <div className="online-status">
            <span />
            Secure business login
          </div>
        </div>
      </header>

      <section className="auth-content">
        <div className="hero-copy">
          <div className="section-kicker">THE BUSINESS CONNECTION</div>

          <h1>
            Wholesale,
            <br />
            <em>made simple.</em>
          </h1>

          <p className="hero-description">
            SarakuSetu connects shops with the products they need,
            making wholesale ordering faster, simpler and more reliable.
          </p>

          <div className="hero-points">
            <div>
              <span>01</span>
              <strong>Discover</strong>
              <p>Find products for your shop.</p>
            </div>

            <div>
              <span>02</span>
              <strong>Order</strong>
              <p>Purchase from your wholesale network.</p>
            </div>

            <div>
              <span>03</span>
              <strong>Grow</strong>
              <p>Keep your business moving.</p>
            </div>
          </div>

          <div className="hero-statement">
            <span>“</span>
            <p>Built around the way real shops buy.</p>
          </div>
        </div>

        <div className="login-area">
          <div className="login-card">
            <div className="login-card-header">
              <div className="progress">
                <span className={step === "phone" ? "active" : ""} />
                <span className={step === "otp" ? "active" : ""} />
              </div>

              <div className="step-text">
                STEP {step === "phone" ? "01" : "02"} / 02
              </div>

              {step === "phone" ? (
                <>
                  <h2>Welcome back.</h2>

                  <p>
                    Enter your mobile number to access your SarakuSetu
                    account.
                  </p>
                </>
              ) : (
                <>
                  <h2>Verify your number.</h2>

                  <p>
                    Enter the 6-digit code sent to{" "}
                    <strong>+91 {phoneNumber}</strong>.
                  </p>
                </>
              )}
            </div>

            {step === "phone" ? (
              <form onSubmit={handleRequestOtp}>
                <label htmlFor="phone">Mobile number</label>

                <div className="phone-field">
                  <span>+91</span>

                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(
                        event.target.value.replace(/\D/g, ""),
                      )
                    }
                    autoComplete="tel"
                  />
                </div>

                <button
                  className="submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span>
                    {isSubmitting ? "Sending OTP..." : "Continue"}
                  </span>

                  {!isSubmitting && <b>→</b>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <label htmlFor="otp">Verification code</label>

                <input
                  id="otp"
                  className="otp-field"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, ""))
                  }
                  autoComplete="one-time-code"
                  autoFocus
                />

                <button
                  className="submit-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span>
                    {isSubmitting ? "Verifying..." : "Verify & Continue"}
                  </span>

                  {!isSubmitting && <b>→</b>}
                </button>

                <div className="otp-links">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtp("");
                      setMessage("");
                    }}
                  >
                    Change number
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            <div className="login-security">
              <div className="security-icon">✓</div>

              <div>
                <strong>Secure authentication</strong>

                <p>
                  Your account is protected with one-time password
                  verification.
                </p>
              </div>
            </div>

            {message && (
              <div
                className={`form-message ${
                  message.includes("Unable") ||
                  message.includes("Invalid") ||
                  message.includes("valid")
                    ? "error"
                    : "success"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          <p className="login-footnote">
            By continuing, you agree to our Terms of Service and Privacy
            Policy.
          </p>
        </div>
      </section>

      <footer className="site-footer">
        <span>© 2026 SarakuSetu</span>
        <span>Wholesale commerce, simplified.</span>
      </footer>
    </main>
  );
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      className="brand-button"
      onClick={onClick}
      aria-label="Go to home"
    >
      <div className="brand">
        <div className="brand-mark">S</div>

        <div className="brand-copy">
          <div className="brand-name">SARAKUSETU</div>
          <div className="brand-tagline">
            Wholesale to Your Shop
          </div>
        </div>
      </div>
    </button>
  );
}

export default App;