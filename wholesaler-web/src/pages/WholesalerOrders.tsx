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

const ACTIVE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
] as const satisfies readonly OrderStatus[];

type ActiveOrderStatus = (typeof ACTIVE_STATUSES)[number];
type OrderFilter = "ALL" | ActiveOrderStatus;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "New",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY: "Ready for Pickup",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

interface StatusAction {
  status: OrderStatus;
  label: string;
  tone?: "danger";
}

const STATUS_ACTIONS: Record<OrderStatus, readonly StatusAction[]> = {
  PENDING: [
    { status: "CONFIRMED", label: "Confirm" },
    { status: "CANCELLED", label: "Cancel", tone: "danger" },
  ],
  CONFIRMED: [
    { status: "PROCESSING", label: "Start Processing" },
    { status: "CANCELLED", label: "Cancel", tone: "danger" },
  ],
  PROCESSING: [{ status: "READY", label: "Mark Ready" }],
  READY: [{ status: "COMPLETED", label: "Complete" }],
  COMPLETED: [],
  CANCELLED: [],
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

function getRetailerSuffix(phoneNumber: string) {
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
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

  const activeOrders = useMemo(
    () =>
      orders.filter((order) =>
        ACTIVE_STATUSES.includes(order.status as ActiveOrderStatus),
      ),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") {
      return activeOrders;
    }

    return activeOrders.filter((order) => order.status === filter);
  }, [activeOrders, filter]);

  const counts = useMemo(() => {
    return {
      all: activeOrders.length,
      pending: activeOrders.filter((order) => order.status === "PENDING").length,
      confirmed: activeOrders.filter((order) => order.status === "CONFIRMED").length,
      processing: activeOrders.filter((order) => order.status === "PROCESSING")
        .length,
      ready: activeOrders.filter((order) => order.status === "READY").length,
    };
  }, [activeOrders]);

  const selectedOrder =
    selectedOrderId === null
      ? null
      : orders.find((order) => order.id === selectedOrderId) ?? null;

  const handleStatusUpdate = async (
    order: WholesalerOrder,
    nextStatus: OrderStatus,
  ) => {
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
              <p>Manage active retailer orders assigned to your business</p>
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

          </section>

          <section className="orders-list-card">
            <div className="orders-list-header">
              <div>
                <h2>
                  {filter === "ALL"
                    ? "Active Orders"
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
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => {
                      const statusActions = STATUS_ACTIONS[order.status];
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
                                {getRetailerSuffix(order.retailer.phoneNumber)}
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
                            <div className="orders-actions">
                              <button
                                className="orders-details-button"
                                type="button"
                                onClick={() => setSelectedOrderId(order.id)}
                              >
                                Details
                              </button>

                              {statusActions.map((action) => (
                                <button
                                  key={action.status}
                                  className={`orders-action-button${
                                    action.tone === "danger"
                                      ? " orders-action-button-danger"
                                      : ""
                                  }`}
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() =>
                                    void handleStatusUpdate(order, action.status)
                                  }
                                >
                                  {isUpdating ? "Updating..." : action.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selectedOrder !== null && (
            <div className="order-details-backdrop" role="presentation">
              <section
                aria-labelledby="order-details-title"
                aria-modal="true"
                className="order-details-dialog"
                role="dialog"
              >
                <header className="order-details-header">
                  <div>
                    <p>Order details</p>
                    <h2 id="order-details-title">#{selectedOrder.id}</h2>
                  </div>

                  <button
                    aria-label="Close order details"
                    className="order-details-close"
                    type="button"
                    onClick={() => setSelectedOrderId(null)}
                  >
                    ×
                  </button>
                </header>

                <div className="order-details-summary">
                  <div>
                    <span>Retailer</span>
                    <strong>
                      Retailer{" "}
                      {getRetailerSuffix(selectedOrder.retailer.phoneNumber)}
                    </strong>
                    <small>
                      {selectedOrder.retailer.phoneNumber} · ID #
                      {selectedOrder.retailer.id}
                    </small>
                  </div>

                  <div>
                    <span>Placed at</span>
                    <strong>{formatDate(selectedOrder.createdAt)}</strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>
                      <span
                        className={`orders-status orders-status-${selectedOrder.status.toLowerCase()}`}
                      >
                        {STATUS_LABELS[selectedOrder.status]}
                      </span>
                    </strong>
                  </div>
                </div>

                <div className="order-details-items">
                  <h3>Ordered items</h3>

                  {selectedOrder.items.map((item) => (
                    <div className="order-details-item" key={item.id}>
                      <div>
                        <strong>{item.productName}</strong>
                        <span>
                          {item.quantity} × {formatAmount(item.unitPrice)}
                        </span>
                      </div>

                      <strong>{formatAmount(item.lineTotal)}</strong>
                    </div>
                  ))}
                </div>

                <footer className="order-details-total">
                  <span>Total ({selectedOrder.items.length} items)</span>
                  <strong>{formatAmount(selectedOrder.subtotal)}</strong>
                </footer>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default WholesalerOrders;
