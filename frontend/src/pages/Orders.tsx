import { useEffect, useState } from "react";

import {
  cancelOrder,
  getOrderDetails,
  getOrders,
} from "../order/orderApi";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  type Order,
  type OrderStatus,
} from "../order/types";
import "./Orders.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getItemLabel(order: Order): string {
  const count = order.items.reduce(
    (total: number, item) => total + item.quantity,
    0,
  );

  return `${count} ${count === 1 ? "item" : "items"}`;
}

function getStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

function OrderStatusTracker({
  status,
}: {
  status: OrderStatus;
}) {
  if (status === "CANCELLED") {
    return (
      <section
        className="order-tracker order-tracker-cancelled"
        aria-label="Order status"
      >
        <span
          className="order-tracker-cancelled-icon"
          aria-hidden="true"
        >
          ×
        </span>

        <div>
          <strong>Order cancelled</strong>

          <p>
            This order will not move through the
            delivery process.
          </p>
        </div>
      </section>
    );
  }

  const currentStep =
    ORDER_STATUS_STEPS.indexOf(status);

  return (
    <section
      className="order-tracker"
      aria-label={`Order status: ${getStatusLabel(status)}`}
    >
      <div className="order-tracker-heading">
        <div>
          <span>ORDER TRACKING</span>
          <strong>
            {getStatusLabel(status)}
          </strong>
        </div>

        <small>Current status</small>
      </div>

      <ol className="order-tracker-steps">
        {ORDER_STATUS_STEPS.map(
          (step, index) => {
            const state =
              index < currentStep
                ? "complete"
                : index === currentStep
                  ? "current"
                  : "upcoming";

            return (
              <li
                className={`order-tracker-step ${state}`}
                key={step}
              >
                <span
                  className="order-tracker-marker"
                  aria-hidden="true"
                >
                  {index < currentStep
                    ? "✓"
                    : index + 1}
                </span>

                <span>
                  {getStatusLabel(step)}
                </span>
              </li>
            );
          },
        )}
      </ol>
    </section>
  );
}

export default function Orders() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isLoadingDetails, setIsLoadingDetails] =
    useState(false);

  const [error, setError] = useState("");

  const [detailsError, setDetailsError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setError("");

        const response = await getOrders();

        setOrders(response);
      } catch {
        setError(
          "Unable to load your orders. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrders();
  }, []);

  async function handleViewOrder(
    orderId: string,
  ) {
    setSelectedOrderId(orderId);
    setSelectedOrder(null);
    setDetailsError("");
    setActionError("");
    setIsLoadingDetails(true);

    try {
      const response =
        await getOrderDetails(orderId);

      setSelectedOrder(response);
    } catch {
      setDetailsError(
        "Unable to load this order. Please try again.",
      );
    } finally {
      setIsLoadingDetails(false);
    }
  }

  async function handleCancelOrder() {
    if (!selectedOrder) {
      return;
    }

    const confirmed = window.confirm(
      `Cancel order #${selectedOrder.id}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setActionError("");

    try {
      const response = await cancelOrder(
        selectedOrder.id,
      );

      const cancelledOrder: Order = {
        ...selectedOrder,
        status:
          response.status === "CANCELLED"
            ? "CANCELLED"
            : selectedOrder.status,
      };

      setSelectedOrder(cancelledOrder);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === selectedOrder.id
            ? cancelledOrder
            : order,
        ),
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to cancel this order.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleBackToOrders() {
    setSelectedOrderId(null);
    setSelectedOrder(null);
    setDetailsError("");
    setActionError("");
  }

  /*
   * -------------------------------------------------------
   * ORDER DETAILS
   * -------------------------------------------------------
   */

  if (selectedOrderId !== null) {
    return (
      <section className="orders-page">
        <div className="orders-container">
          <button
            className="order-back-button"
            type="button"
            onClick={handleBackToOrders}
          >
            ← Back to orders
          </button>

          {isLoadingDetails && (
            <div className="orders-status">
              <strong>
                Loading order...
              </strong>

              <span>
                Please wait a moment.
              </span>
            </div>
          )}

          {detailsError && (
            <div className="orders-status orders-error">
              <strong>
                {detailsError}
              </strong>

              <span>
                Check your connection and try
                again.
              </span>
            </div>
          )}

          {!isLoadingDetails &&
            !detailsError &&
            selectedOrder && (
              <div className="order-details">
                <div className="order-details-header">
                  <div>
                    <span className="orders-kicker">
                      ORDER DETAILS
                    </span>

                    <h1>
                      #{selectedOrder.id}
                    </h1>

                    <p>
                      Placed on{" "}
                      {formatDate(
                        selectedOrder.createdAt,
                      )}
                    </p>
                  </div>

                  <span
                    className={`order-status order-status-${selectedOrder.status.toLowerCase()}`}
                  >
                    {getStatusLabel(
                      selectedOrder.status,
                    )}
                  </span>
                </div>

                <OrderStatusTracker
                  status={selectedOrder.status}
                />

                {(selectedOrder.status ===
                  "PENDING" ||
                  selectedOrder.status ===
                    "CONFIRMED") && (
                  <div className="order-actions">
                    <button
                      type="button"
                      className="order-cancel-button"
                      onClick={
                        handleCancelOrder
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      {actionLoading
                        ? "Cancelling..."
                        : "Cancel order"}
                    </button>
                  </div>
                )}

                {actionError && (
                  <div
                    className="order-action-error"
                    role="alert"
                  >
                    {actionError}
                  </div>
                )}

                <div className="order-details-card">
                  <div className="order-details-card-header">
                    <div>
                      <small>ITEMS</small>

                      <strong>
                        {getItemLabel(
                          selectedOrder,
                        )}
                      </strong>
                    </div>

                    <div>
                      <small>SUBTOTAL</small>

                      <strong>
                        ₹
                        {selectedOrder.subtotal.toFixed(
                          2,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="order-details-items">
                    {selectedOrder.items.map(
                      (item) => (
                        <div
                          className="order-detail-item"
                          key={item.id}
                        >
                          <div className="order-detail-item-main">
                            <strong>
                              {item.productName}
                            </strong>

                            <span>
                              ₹
                              {item.unitPrice.toFixed(
                                2,
                              )}{" "}
                              ×{" "}
                              {item.quantity}
                            </span>
                          </div>

                          <strong>
                            ₹
                            {item.lineTotal.toFixed(
                              2,
                            )}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="order-details-total">
                    <span>
                      Order subtotal
                    </span>

                    <strong>
                      ₹
                      {selectedOrder.subtotal.toFixed(
                        2,
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            )}
        </div>
      </section>
    );
  }

  /*
   * -------------------------------------------------------
   * ORDERS LIST
   * -------------------------------------------------------
   */

  return (
    <section className="orders-page">
      <div className="orders-container">
        <div className="orders-header">
          <div>
            <span className="orders-kicker">
              YOUR PURCHASES
            </span>

            <h1>Orders</h1>

            <p>
              Keep track of every order from
              your shop.
            </p>
          </div>

          {!isLoading &&
            !error &&
            orders.length > 0 && (
              <div className="orders-count">
                {orders.length}{" "}
                {orders.length === 1
                  ? "order"
                  : "orders"}
              </div>
            )}
        </div>

        {isLoading && (
          <div className="orders-status">
            <strong>
              Loading your orders...
            </strong>

            <span>
              Please wait a moment.
            </span>
          </div>
        )}

        {error && (
          <div className="orders-status orders-error">
            <strong>{error}</strong>

            <span>
              Check your connection and try
              again.
            </span>
          </div>
        )}

        {!isLoading &&
          !error &&
          orders.length === 0 && (
            <div className="orders-status">
              <strong>
                No orders yet.
              </strong>

              <span>
                Your completed orders will
                appear here once you place one.
              </span>
            </div>
          )}

        {!isLoading &&
          !error &&
          orders.length > 0 && (
            <div className="orders-list">
              {orders.map((order) => (
                <article
                  className={`order-card order-card-${order.status.toLowerCase()}`}
                  key={order.id}
                >
                  <div className="order-card-top">
                    <div>
                      <span className="order-label">
                        ORDER NUMBER
                      </span>

                      <h2>
                        #{order.id}
                      </h2>
                    </div>

                    <span
                      className={`order-status order-status-${order.status.toLowerCase()}`}
                    >
                      {formatStatus(
                        order.status,
                      )}
                    </span>
                  </div>

                  <div className="order-card-meta">
                    <div>
                      <small>PLACED</small>

                      <time
                        dateTime={
                          order.createdAt
                        }
                      >
                        {formatDateTime(
                          order.createdAt,
                        )}
                      </time>
                    </div>

                    <div>
                      <small>ITEMS</small>

                      <span>
                        {getItemLabel(order)}
                      </span>
                    </div>
                  </div>

                  <div className="order-card-bottom">
                    <div>
                      <small>
                        ORDER SUBTOTAL
                      </small>

                      <strong>
                        ₹
                        {order.subtotal.toFixed(
                          2,
                        )}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void handleViewOrder(
                          order.id,
                        )
                      }
                    >
                      View order{" "}
                      <span>→</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
      </div>
    </section>
  );
}