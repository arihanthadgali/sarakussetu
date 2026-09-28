import { useCallback, useEffect, useMemo, useState } from "react";

import "./WholesalerDashboard.css";
import WholesalerSidebar, {
  type WholesalerPage,
} from "../components/WholesalerSidebar";

import {
  getWholesalerOrders,
  updateWholesalerOrderStatus,
} from "../orders/orderApi";
import type { OrderStatus, WholesalerOrder } from "../orders/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "NEW",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  READY: "READY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "READY",
  READY: "COMPLETED",
};

const NEXT_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  PENDING: "Confirm",
  CONFIRMED: "Start Processing",
  PROCESSING: "Mark Ready",
  READY: "Complete",
};

function formatAmount(amount: number) {
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInitials(phoneNumber: string) {
  return phoneNumber.slice(-2);
}

function WholesalerDashboard({
  onLogout,
  onNavigate,
}: {
  onLogout: () => void;
  onNavigate: (page: WholesalerPage) => void;
}) {
  const [orders, setOrders] = useState<WholesalerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);

      const data = await getWholesalerOrders();

      setOrders(data);
    } catch {
      setError("Unable to load orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const summary = useMemo(() => {
    const today = new Date();

    const isToday = (date: string) => {
      const orderDate = new Date(date);

      return (
        orderDate.getFullYear() === today.getFullYear() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getDate() === today.getDate()
      );
    };

    return {
      pending: orders.filter((order) => order.status === "PENDING").length,
      confirmed: orders.filter((order) => order.status === "CONFIRMED").length,
      processing: orders.filter((order) => order.status === "PROCESSING")
        .length,
      ready: orders.filter((order) => order.status === "READY").length,
      today: orders.filter((order) => isToday(order.createdAt)).length,
    };
  }, [orders]);

  const handleStatusUpdate = async (order: WholesalerOrder) => {
    const nextStatus = NEXT_STATUS[order.status];

    if (nextStatus === undefined) {
      return;
    }

    try {
      setUpdatingOrderId(order.id);
      setError(null);

      const updatedOrder = await updateWholesalerOrderStatus(
        order.id,
        nextStatus,
      );

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === updatedOrder.id
            ? {
                ...currentOrder,
                status: updatedOrder.status,
                updatedAt: updatedOrder.updatedAt,
              }
            : currentOrder,
        ),
      );
    } catch {
      setError("Unable to update the order status. Please try again.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="wholesaler-dashboard">
      <WholesalerSidebar
        activePage="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Manage your assigned retailer orders</p>
          </div>

          <div className="header-actions">
            <button
              className="notification-button"
              type="button"
              aria-label="Notifications"
            >
              ♧
            </button>

            <div className="profile">
              <div className="profile-avatar">W</div>

              <div>
                <strong>Wholesaler</strong>
                <span>Account</span>
              </div>
            </div>
          </div>
        </header>

        {error !== null && (
          <div className="dashboard-alert" role="alert">
            <span>{error}</span>

            <button type="button" onClick={() => void loadOrders()}>
              Retry
            </button>
          </div>
        )}

        <section className="summary-grid" aria-label="Order summary">
          <SummaryCard
            label="New Orders"
            value={summary.pending}
            icon="▣"
            tone="blue"
          />

          <SummaryCard
            label="Confirmed"
            value={summary.confirmed}
            icon="✓"
            tone="green"
          />

          <SummaryCard
            label="Processing"
            value={summary.processing}
            icon="◫"
            tone="orange"
          />

          <SummaryCard
            label="Ready for Pickup"
            value={summary.ready}
            icon="▣"
            tone="purple"
          />

          <SummaryCard
            label="Today's Orders"
            value={summary.today}
            icon="□"
            tone="blue"
          />
        </section>

        <section className="orders-card">
          <div className="section-header">
            <div>
              <h2>Incoming Orders</h2>
              <p>Orders assigned to your business</p>
            </div>

            <button
              className="view-all-button"
              type="button"
              onClick={() => void loadOrders()}
              disabled={isLoading}
            >
              Refresh
            </button>
          </div>

          <div className="orders-table-wrapper">
            {isLoading ? (
              <div className="orders-state">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="orders-state">
                <strong>No orders yet</strong>
                <span>
                  Assigned retailer orders will appear here.
                </span>
              </div>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Retailer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Placed At</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const nextStatus = NEXT_STATUS[order.status];
                    const actionLabel = NEXT_ACTION_LABELS[order.status];
                    const isUpdating = updatingOrderId === order.id;

                    return (
                      <tr key={order.id}>
                        <td className="order-id">#{order.id}</td>

                        <td>
                          <div className="retailer-cell">
                            <strong>
                              Retailer {getInitials(order.retailer.phoneNumber)}
                            </strong>

                            <span>{order.retailer.phoneNumber}</span>
                          </div>
                        </td>

                        <td>{order.items.length}</td>

                        <td>{formatAmount(order.subtotal)}</td>

                        <td>{formatDate(order.createdAt)}</td>

                        <td>
                          <StatusBadge status={order.status} />
                        </td>

                        <td>
                          {nextStatus !== undefined &&
                          actionLabel !== undefined ? (
                            <button
                              className="action-button"
                              type="button"
                              disabled={isUpdating}
                              onClick={() => void handleStatusUpdate(order)}
                            >
                              {isUpdating ? "Updating..." : actionLabel}
                            </button>
                          ) : (
                            <span className="action-complete">
                              {order.status === "COMPLETED"
                                ? "Completed"
                                : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: string;
  tone: "blue" | "green" | "orange" | "purple";
}) {
  return (
    <article className="summary-card">
      <div className="summary-card-top">
        <span>{label}</span>

        <div className={`summary-icon ${tone}`}>{icon}</div>
      </div>

      <strong>{value}</strong>

      <span className="summary-link">View all</span>
    </article>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default WholesalerDashboard;