import { useEffect, useState } from "react";

import { requestOtp } from "../auth/authApi";
import { useAuth } from "../auth/useAuth";
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type Cart,
} from "../cart/cartApi";
import {
  clearGuestCart,
  getGuestCart,
  getGuestCartTotals,
  removeGuestCartItem,
  updateGuestCartItem,
} from "../cart/guestCart";
import { createOrder } from "../order/orderApi";
import type { OrderDetails } from "../order/types";
import { OtpVerification } from "./OtpVerification";
import "./Cart.css";

export default function Cart() {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [orderCreated, setOrderCreated] = useState<OrderDetails | null>(null);

  const [checkoutStep, setCheckoutStep] = useState<
    "idle" | "phone" | "otp"
  >("idle");

  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutPhoneError, setCheckoutPhoneError] = useState("");

  async function loadCart() {
    try {
      setError("");

      if (!isAuthenticated) {
        const guestItems = getGuestCart();
        const totals = getGuestCartTotals(guestItems);

        const guestCart: Cart = {
          id: null,
          items: guestItems.map((item) => ({
            id: `guest-${item.product.id}`,
            quantity: item.quantity,
            product: item.product,
            lineTotal: item.product.price * item.quantity,
          })),
          subtotal: totals.subtotal,
          itemCount: totals.itemCount,
        };

        setCart(guestCart);
        return;
      }

      const response = await getCart();
      setCart(response);
    } catch {
      setError("Unable to load your cart. Please try again.");
    }
  }

  useEffect(() => {
    setIsLoading(true);

    loadCart().finally(() => {
      setIsLoading(false);
    });
  }, [isAuthenticated]);

  async function handleRequestCheckoutOtp() {
    const phone = checkoutPhone.replace(/\D/g, "");

    if (phone.length !== 10) {
      setCheckoutPhoneError(
        "Please enter a valid 10-digit mobile number.",
      );
      return;
    }

    setCheckoutPhone(phone);
    setCheckoutPhoneError("");
    setCheckoutError("");
    setIsCheckingOut(true);

    try {
      await requestOtp(phone);
      setCheckoutStep("otp");
    } catch {
      setCheckoutPhoneError(
        "Unable to send OTP. Please try again.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function mergeGuestCart() {
    const guestItems = getGuestCart();

    for (const item of guestItems) {
      await addToCart(item.product.id, item.quantity);
    }

    clearGuestCart();
  }

  async function handleCheckoutVerified() {
    setIsCheckingOut(true);
    setCheckoutError("");

    try {
      await mergeGuestCart();

      const order = await createOrder();

      setOrderCreated(order);
      setCheckoutStep("idle");

      const refreshedCart = await getCart();
      setCart(refreshedCart);
    } catch {
      setCheckoutError(
        "Your number was verified, but we couldn't place the order. Please try again.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function handleCheckout() {
    setCheckoutError("");

    if (!isAuthenticated) {
      setCheckoutPhoneError("");
      setCheckoutStep("phone");
      return;
    }

    setIsCheckingOut(true);

    try {
      const order = await createOrder();

      setOrderCreated(order);

      const refreshedCart = await getCart();
      setCart(refreshedCart);
    } catch {
      setCheckoutError(
        "Unable to place your order. Please check your cart and try again.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  async function handleQuantityChange(
    cartItemId: string,
    quantity: number,
  ) {
    if (quantity < 1) {
      return;
    }

    if (!isAuthenticated) {
      const productId = Number(
        cartItemId.replace("guest-", ""),
      );

      const items = updateGuestCartItem(productId, quantity);
      const totals = getGuestCartTotals(items);

      setCart({
        id: null,
        items: items.map((item) => ({
          id: `guest-${item.product.id}`,
          quantity: item.quantity,
          product: item.product,
          lineTotal: item.product.price * item.quantity,
        })),
        subtotal: totals.subtotal,
        itemCount: totals.itemCount,
      });

      return;
    }

    setUpdatingItemId(cartItemId);
    setError("");

    try {
      const updatedItem = await updateCartItem(
        cartItemId,
        quantity,
      );

      setCart((currentCart) => {
        if (!currentCart) {
          return currentCart;
        }

        const items = currentCart.items.map((item) =>
          item.id === cartItemId
            ? {
                ...item,
                quantity: updatedItem.quantity,
                lineTotal:
                  updatedItem.product.price *
                  updatedItem.quantity,
              }
            : item,
        );

        const itemCount = items.reduce(
          (total, item) => total + item.quantity,
          0,
        );

        const subtotal = items.reduce(
          (total, item) => total + item.lineTotal,
          0,
        );

        return {
          ...currentCart,
          items,
          itemCount,
          subtotal,
        };
      });
    } catch {
      setError("Unable to update the quantity. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleRemoveItem(cartItemId: string) {
    if (!isAuthenticated) {
      const productId = Number(
        cartItemId.replace("guest-", ""),
      );

      const items = removeGuestCartItem(productId);
      const totals = getGuestCartTotals(items);

      setCart({
        id: null,
        items: items.map((item) => ({
          id: `guest-${item.product.id}`,
          quantity: item.quantity,
          product: item.product,
          lineTotal: item.product.price * item.quantity,
        })),
        subtotal: totals.subtotal,
        itemCount: totals.itemCount,
      });

      return;
    }

    setRemovingItemId(cartItemId);
    setError("");

    try {
      await removeCartItem(cartItemId);

      setCart((currentCart) => {
        if (!currentCart) {
          return currentCart;
        }

        const items = currentCart.items.filter(
          (item) => item.id !== cartItemId,
        );

        const itemCount = items.reduce(
          (total, item) => total + item.quantity,
          0,
        );

        const subtotal = items.reduce(
          (total, item) => total + item.lineTotal,
          0,
        );

        return {
          ...currentCart,
          items,
          itemCount,
          subtotal,
        };
      });
    } catch {
      setError("Unable to remove the item. Please try again.");
    } finally {
      setRemovingItemId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="cart-page">
        <div className="cart-container">
          <div className="cart-header">
            <span className="cart-kicker">YOUR ORDER</span>
            <h1>Cart</h1>
          </div>

          <div className="cart-status">
            Loading your cart...
          </div>
        </div>
      </section>
    );
  }

  if (error && !cart) {
    return (
      <section className="cart-page">
        <div className="cart-container">
          <div className="cart-header">
            <span className="cart-kicker">YOUR ORDER</span>
            <h1>Cart</h1>
          </div>

          <div className="cart-status cart-error">
            {error}
          </div>
        </div>
      </section>
    );
  }

  if (checkoutStep === "phone") {
    return (
      <section className="cart-page">
        <div className="cart-container">
          <div className="cart-header">
            <span className="cart-kicker">CHECKOUT</span>
            <h1>Verify your number</h1>
            <p>
              Enter your mobile number to place your order.
            </p>
          </div>

          <div className="checkout-auth-card">
            <label htmlFor="checkout-phone">
              Mobile number
            </label>

            <input
              id="checkout-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={checkoutPhone}
              onChange={(event) => {
                setCheckoutPhone(
                  event.target.value.replace(/\D/g, ""),
                );
                setCheckoutPhoneError("");
              }}
              placeholder="10-digit mobile number"
              disabled={isCheckingOut}
              autoFocus
            />

            {checkoutPhoneError && (
              <p className="checkout-error">
                {checkoutPhoneError}
              </p>
            )}

            <button
              type="button"
              className="checkout-button"
              onClick={handleRequestCheckoutOtp}
              disabled={isCheckingOut}
            >
              {isCheckingOut
                ? "Sending OTP..."
                : "Continue →"}
            </button>

            <button
              type="button"
              className="cart-remove-button"
              onClick={() => setCheckoutStep("idle")}
              disabled={isCheckingOut}
            >
              ← Back to cart
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (checkoutStep === "otp") {
    return (
      <section className="cart-page">
        <div className="cart-container">
          <div className="cart-header">
            <span className="cart-kicker">CHECKOUT</span>
            <h1>Verify your number</h1>
            <p>One last step before placing your order.</p>
          </div>

          {checkoutError && (
            <div className="checkout-error">
              {checkoutError}
            </div>
          )}

          <OtpVerification
            phoneNumber={checkoutPhone}
            onBack={() => setCheckoutStep("phone")}
            onVerified={handleCheckoutVerified}
          />
        </div>
      </section>
    );
  }

  if (orderCreated !== null) {
    return (
      <section className="cart-page">
        <div className="cart-container">
          <div className="checkout-success">
            <span className="checkout-success-icon">✓</span>

            <span className="cart-kicker">
              ORDER CONFIRMED
            </span>

            <h1>Order placed.</h1>

            <p>
              Your order <strong>#{orderCreated.id}</strong>{" "}
              has been created successfully.
            </p>

            <div className="checkout-success-summary">
              <div>
                <small>ORDER TOTAL</small>
                <strong>
                  ₹{orderCreated.subtotal.toFixed(2)}
                </strong>
              </div>

              <div>
                <small>STATUS</small>
                <strong>{orderCreated.status}</strong>
              </div>
            </div>

            <button
              type="button"
              className="checkout-success-button"
              onClick={() => {
                setOrderCreated(null);
                loadCart();
              }}
            >
              Continue shopping →
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="cart-page">
        <div className="cart-container">
          <div className="cart-header">
            <span className="cart-kicker">YOUR ORDER</span>
            <h1>Cart</h1>
            <p>Your cart is currently empty.</p>
          </div>

          <div className="cart-status">
            <strong>No products added yet.</strong>
            <span>
              Browse the catalog to start building your order.
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <div>
            <span className="cart-kicker">YOUR ORDER</span>
            <h1>Cart</h1>
            <p>Review the products you've selected.</p>
          </div>

          <div className="cart-count">
            {cart.itemCount}{" "}
            {cart.itemCount === 1 ? "item" : "items"}
          </div>
        </div>

        {error && (
          <div className="cart-status cart-error">
            {error}
          </div>
        )}

        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => {
              const isUpdating =
                updatingItemId === item.id;
              const isRemoving =
                removingItemId === item.id;

              return (
                <article
                  className="cart-item"
                  key={item.id}
                >
                  <div className="cart-item-image">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                      />
                    ) : (
                      <div className="cart-item-placeholder">
                        S
                      </div>
                    )}
                  </div>

                  <div className="cart-item-content">
                    <div>
                      <h2>{item.product.name}</h2>
                      <p>{item.product.description}</p>
                    </div>

                    <div className="cart-item-details">
                      <div className="cart-quantity">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              item.quantity - 1,
                            )
                          }
                          disabled={
                            isUpdating ||
                            isRemoving ||
                            item.quantity <= 1
                          }
                          aria-label={`Decrease ${item.product.name} quantity`}
                        >
                          −
                        </button>

                        <span>
                          Qty: {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(
                              item.id,
                              item.quantity + 1,
                            )
                          }
                          disabled={
                            isUpdating || isRemoving
                          }
                          aria-label={`Increase ${item.product.name} quantity`}
                        >
                          +
                        </button>
                      </div>

                      <strong>
                        ₹{item.lineTotal.toFixed(2)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="cart-remove-button"
                      onClick={() =>
                        handleRemoveItem(item.id)
                      }
                      disabled={
                        isRemoving || isUpdating
                      }
                    >
                      {isRemoving
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="cart-summary">
            <span>ORDER SUMMARY</span>

            <div className="cart-summary-row">
              <span>Items</span>
              <span>{cart.itemCount}</span>
            </div>

            <div className="cart-summary-total">
              <span>Subtotal</span>
              <strong>
                ₹{cart.subtotal.toFixed(2)}
              </strong>
            </div>

            {checkoutError && (
              <div className="checkout-error">
                {checkoutError}
              </div>
            )}

            <button
              type="button"
              className="checkout-button"
              onClick={handleCheckout}
              disabled={
                isCheckingOut ||
                cart.items.length === 0
              }
            >
              {isCheckingOut
                ? "Placing order..."
                : "Place Order"}
              <span>→</span>
            </button>

            <small>
              {isAuthenticated
                ? "Your order will be created immediately."
                : "You'll verify your mobile number before the order is placed."}
            </small>
          </aside>
        </div>
      </div>
    </section>
  );
}