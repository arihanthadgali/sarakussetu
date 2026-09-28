import { useCallback, useEffect, useMemo, useState } from "react";

import "./WholesalerOrders.css";
import WholesalerSidebar, {
  type WholesalerPage,
} from "../components/WholesalerSidebar";

import {
  getWholesalerOrders,
  updateWholesalerOrderStatus,
} from "../orders/orderApi";
import type { OrderStatus, WholesalerOrder } from "../orders/types";

type OrderFilter = "ALL" | OrderStatus;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "New",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY: "Ready for Pickup",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
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

function WholesalerOrders({
  onNavigate,
  onLogout,
}: {
  onNavigate: (page: WholesalerPage) => void;
  onLogout: () => void;
}) {
  const [orders, setOrders] = useState<WholesalerOrder[]>([]);
  const [filter, setFilter] = useState<OrderFilter>("ALL");
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

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") {
      return orders;
    }

    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((order) => order.status === "PENDING").length,
      confirmed: orders.filter((order) => order.status === "CONFIRMED").length,
      processing: orders.filter((order) => order.status === "PROCESSING").length,
      ready: orders.filter((order) => order.status === "READY").length,
      completed: orders.filter((order) => order.status === "COMPLETED").length,
      cancelled: orders.filter((order) => order.status === "CANCELLED").length,
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
        activePage="orders"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        <div className="wholesaler-orders-page">
          <header className="orders-page-header">
            <div>
              <h1>Orders</h1>
              <p>Manage retailer orders assigned to your business</p>
            </div>

            <button
              className="orders-refresh-button"
              type="button"
              onClick={() => void loadOrders()}
              disabled={isLoading}
            >
              Refresh
            </button>
          </header>

          {error !== null && (
            <div className="orders-alert" role="alert">
              <span>{error}</span>

              <button type="button" onClick={() => void loadOrders()}>
                Retry
              </button>
            </div>
          )}

          <section className="order-filter-card" aria-label="Order filters">
            <button
              className={
                filter === "ALL" ? "order-filter active" : "order-filter"
              }
              type="button"
              onClick={() => setFilter("ALL")}
            >
              All
              <span>{counts.all}</span>
            </button>

            <button
              className={
                filter === "PENDING" ? "order-filter active" : "order-filter"
              }
              type="button"
              onClick={() => setFilter("PENDING")}
            >
              New
              <span>{counts.pending}</span>
            </button>

            <button
              className={
                filter === "CONFIRMED" ? "order-filter active" : "order-filter"
              }
              type="button"
              onClick={() => setFilter("CONFIRMED")}
            >
              Confirmed
              <span>{counts.confirmed}</span>
            </button>

            <button
              className={
                filter === "PROCESSING" ? "order-filter active" : "order-filter"
              }
              type="button"
              onClick={() => setFilter("PROCESSING")}
            >
              Processing
              <span>{counts.processing}</span>
            </button>

            <button
              className={
                filter === "READY" ? "order-filter active" : "order-filter"
              }
              type="button"
              onClick={() => setFilter("READY")}
            >
              Ready
              <span>{counts.ready}</span>
            </button>

            <button
              className={
                filter === "COMPLETED" ? "order-filter active" : "order-filter"
              }
              type="button"
              onClick={() => setFilter("COMPLETED")}
            >
              Completed
              <span>{counts.completed}</span>
            </button>

            <button
              className={
                filter === "CANCELLED" ? "order-filter active" : "order-filter"
              }
              type="button"
              onClick={() => setFilter("CANCELLED")}
            >
              Cancelled
              <span>{counts.cancelled}</span>
            </button>
          </section>

          <section className="orders-list-card">
            <div className="orders-list-header">
              <div>
                <h2>
                  {filter === "ALL"
                    ? "All Orders"
                    : STATUS_LABELS[filter]}
                </h2>

                <p>
                  {filteredOrders.length}{" "}
                  {filteredOrders.length === 1 ? "order" : "orders"}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="orders-page-state">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="orders-page-state">
                <strong>No orders found</strong>
                <span>
                  Orders matching this status will appear here.
                </span>
              </div>
            ) : (
              <div className="orders-table-scroll">
                <table className="orders-page-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Retailer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Placed At</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => {
                      const nextStatus = NEXT_STATUS[order.status];
                      const actionLabel = NEXT_ACTION_LABELS[order.status];
                      const isUpdating = updatingOrderId === order.id;

                      return (
                        <tr key={order.id}>
                          <td>
                            <strong className="orders-page-order-id">
                              #{order.id}
                            </strong>
                          </td>

                          <td>
                            <div className="orders-page-retailer">
                              <strong>
                                Retailer{" "}
                                {getInitials(order.retailer.phoneNumber)}
                              </strong>

                              <span>{order.retailer.phoneNumber}</span>
                            </div>
                          </td>

                          <td>
                            {order.items.length}{" "}
                            {order.items.length === 1 ? "item" : "items"}
                          </td>

                          <td>
                            <strong>{formatAmount(order.subtotal)}</strong>
                          </td>

                          <td>{formatDate(order.createdAt)}</td>

                          <td>
                            <span
                              className={`orders-status orders-status-${order.status.toLowerCase()}`}
                            >
                              {STATUS_LABELS[order.status]}
                            </span>
                          </td>

                          <td>
                            {nextStatus !== undefined &&
                            actionLabel !== undefined ? (
                              <button
                                className="orders-action-button"
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  void handleStatusUpdate(order)
                                }
                              >
                                {isUpdating ? "Updating..." : actionLabel}
                              </button>
                            ) : (
                              <span className="orders-action-complete">
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
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default WholesalerOrders;