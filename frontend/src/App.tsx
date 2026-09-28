import { useState } from "react";
import "./App.css";

import { useAuth } from "./auth/useAuth";

import Cart from "./pages/Cart";
import { Home } from "./pages/Home";
import Orders from "./pages/Orders";
import ProductCatalog from "./pages/ProductCatalog";


function App() {
  const { isAuthenticated, isLoading, logout } = useAuth();

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

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="loader" />
      </div>
    );
  }

  if (showProducts) {
    return (
      <main className="dashboard-page">
        <header className="site-header">
          <Brand onClick={goHome} />

          <div className="header-right">
            {isAuthenticated && (
              <div className="online-status">
                <span />
                Account active
              </div>
            )}

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
              Cart →
            </button>

            {isAuthenticated && (
              <>
                <button
                  className="header-button"
                  type="button"
                  onClick={openOrders}
                >
                  Orders
                </button>

                <button
                  className="header-button"
                  type="button"
                  onClick={logout}
                >
                  Sign out
                </button>
              </>
            )}
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
            {isAuthenticated && (
              <div className="online-status">
                <span />
                Account active
              </div>
            )}

            <button
              className="header-button"
              type="button"
              onClick={openProducts}
            >
              ← Products
            </button>

            {isAuthenticated && (
              <>
                <button
                  className="header-button"
                  type="button"
                  onClick={openOrders}
                >
                  Orders
                </button>

                <button
                  className="header-button"
                  type="button"
                  onClick={logout}
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </header>

        <Cart />
      </main>
    );
  }

  if (showOrders) {
    if (!isAuthenticated) {
      return (
        <main className="dashboard-page">
          <header className="site-header">
            <Brand onClick={goHome} />

            <div className="header-right">
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
            </div>
          </header>

          <section className="auth-content">
            <div className="hero-copy">
              <div className="section-kicker">YOUR ORDERS</div>

              <h1>
                Orders are
                <br />
                <em>available after checkout.</em>
              </h1>

              <p className="hero-description">
                Add the products you need to your cart. We will verify your
                mobile number when you place your first order.
              </p>

              <button
                className="submit-button"
                type="button"
                onClick={openProducts}
              >
                <span>Browse products</span>
                <b>→</b>
              </button>
            </div>
          </section>
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

        <Orders />
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="site-header">
        <Brand onClick={goHome} />

        <div className="header-right">
          {isAuthenticated && (
            <div className="online-status">
              <span />
              Account active
            </div>
          )}

          <button
            className="header-button"
            type="button"
            onClick={openProducts}
          >
            Products
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
            onClick={openOrders}
          >
            Orders
          </button>

          {isAuthenticated && (
            <button
              className="header-button"
              type="button"
              onClick={logout}
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      <Home
        onBrowseProducts={openProducts}
        onOpenCart={openCart}
        onOpenOrders={openOrders}
      />
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