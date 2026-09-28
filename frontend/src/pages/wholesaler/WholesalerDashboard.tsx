import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getWholesalerOrders,
  updateWholesalerOrderStatus,
} from "../../wholesaler/wholesalerApi";
import type {
  WholesalerOrder,
  WholesalerOrderStatus,
} from "../../wholesaler/types";

import "./WholesalerDashboard.css";

interface WholesalerDashboardProps {
  onLogout: () => void;
}

const statusLabels: Record<WholesalerOrderStatus, string> = {
  PENDING: "New",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const nextStatus: Partial<
  Record<WholesalerOrderStatus, WholesalerOrderStatus>
> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "READY",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function WholesalerDashboard({
  onLogout,
}: WholesalerDashboardProps) {
  const [orders, setOrders] = useState<WholesalerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);

      const result = await getWholesalerOrders();

      setOrders(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load orders.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const counts = useMemo(
    () => ({
      pending: orders.filter((order) => order.status === "PENDING").length,
      confirmed: orders.filter((order) => order.status === "CONFIRMED").length,
      processing: orders.filter((order) => order.status === "PROCESSING")
        .length,
      ready: orders.filter((order) => order.status === "READY").length,
    }),
    [orders],
  );

  const handleStatusUpdate = async (
    order: WholesalerOrder,
    status: WholesalerOrderStatus,
  ) => {
    try {
      setUpdatingOrderId(order.id);
      setError(null);

      const updated = await updateWholesalerOrderStatus(order.id, status);

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? {
                ...currentOrder,
                status: updated.status,
                updatedAt: updated.updatedAt,
              }
            : currentOrder,
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update order status.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <main className="wholesaler-page">
      <header className="wholesaler-header">
        <div>
          <div className="wholesaler-brand">SARAKUSETU</div>
          <div className="wholesaler-subtitle">Wholesaler Dashboard</div>
        </div>

        <div className="wholesaler-header-actions">
          <div className="wholesaler-account-status">
            <span />
            Account active
          </div>

          <button
            className="wholesaler-signout"
            type="button"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="wholesaler-content">
        <div className="wholesaler-heading">
          <div>
            <div className="wholesaler-kicker">OPERATIONS</div>
            <h1>Orders</h1>
            <p>Manage incoming retailer orders and prepare them for pickup.</p>
          </div>

          <button
            className="wholesaler-refresh"
            type="button"
            onClick={() => {
              setIsLoading(true);
              void loadOrders();
            }}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>

        <section className="wholesaler-stats">
          <StatCard label="New" value={counts.pending} />
          <StatCard label="Confirmed" value={counts.confirmed} />
          <StatCard label="Processing" value={counts.processing} />
          <StatCard label="Ready" value={counts.ready} />
        </section>

        {error && (
          <div className="wholesaler-error" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="wholesaler-empty">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="wholesaler-empty">
            <h2>No orders yet</h2>
            <p>New retailer orders will appear here.</p>
          </div>
        ) : (
          <section className="wholesaler-orders">
            {orders.map((order) => {
              const upcomingStatus = nextStatus[order.status];
              const isUpdating = updatingOrderId === order.id;

              return (
                <article className="wholesaler-order-card" key={order.id}>
                  <div className="order-card-top">
                    <div>
                      <span className="order-number">
                        Order #{order.id}
                      </span>

                      <span
                        className={`order-status order-status-${order.status.toLowerCase()}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </div>

                    <span className="order-date">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="order-card-main">
                    <div className="order-retailer">
                      <span className="order-label">Retailer</span>
                      <strong>{order.retailer.phoneNumber}</strong>
                    </div>

                    <div className="order-items-summary">
                      <span className="order-label">Items</span>
                      <strong>
                        {order.items.reduce(
                          (total, item) => total + item.quantity,
                          0,
                        )}
                      </strong>
                    </div>

                    <div className="order-total">
                      <span className="order-label">Subtotal</span>
                      <strong>{formatCurrency(order.subtotal)}</strong>
                    </div>
                  </div>

                  <div className="order-products">
                    {order.items.map((item) => (
                      <div className="order-product" key={item.id}>
                        <span>{item.productName}</span>
                        <span>
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <span>
                      Last updated {formatDate(order.updatedAt)}
                    </span>

                    {upcomingStatus && (
                      <button
                        className="order-action"
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          void handleStatusUpdate(
                            order,
                            upcomingStatus,
                          )
                        }
                      >
                        {isUpdating
                          ? "Updating..."
                          : `Mark ${statusLabels[upcomingStatus]}`}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="wholesaler-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
