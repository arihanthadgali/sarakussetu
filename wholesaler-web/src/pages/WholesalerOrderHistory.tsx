import { useCallback, useEffect, useMemo, useState } from "react";

import WholesalerSidebar, {
  type WholesalerPage,
} from "../components/WholesalerSidebar";
import {
  getWholesalerOrders,
} from "../orders/orderApi";
import type { OrderStatus, WholesalerOrder } from "../orders/types";
import "./WholesalerOrderHistory.css";

const HISTORY_STATUSES = ["COMPLETED", "CANCELLED"] as const satisfies readonly OrderStatus[];

type HistoryOrderStatus = (typeof HISTORY_STATUSES)[number];
type HistoryFilter = "ALL" | HistoryOrderStatus;

const STATUS_LABELS: Record<HistoryOrderStatus, string> = {
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
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

function WholesalerOrderHistory({
  onNavigate,
  onLogout,
}: {
  onNavigate: (page: WholesalerPage) => void;
  onLogout: () => void;
}) {
  const [orders, setOrders] = useState<WholesalerOrder[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);

      const data = await getWholesalerOrders();

      setOrders(data);
    } catch {
      setError("Unable to load order history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const historyOrders = useMemo(
    () =>
      orders.filter(
        (order) => HISTORY_STATUSES.includes(order.status as HistoryOrderStatus),
      ),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    if (filter === "ALL") {
      return historyOrders;
    }

    return historyOrders.filter((order) => order.status === filter);
  }, [filter, historyOrders]);

  const counts = useMemo(
    () => ({
      all: historyOrders.length,
      completed: historyOrders.filter((order) => order.status === "COMPLETED")
        .length,
      cancelled: historyOrders.filter((order) => order.status === "CANCELLED")
        .length,
    }),
    [historyOrders],
  );

  const selectedOrder =
    selectedOrderId === null
      ? null
      : historyOrders.find((order) => order.id === selectedOrderId) ?? null;

  return (
    <div className="wholesaler-dashboard">
      <WholesalerSidebar
        activePage="history"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        <div className="wholesaler-history-page">
          <header className="history-page-header">
            <div>
              <h1>Order History</h1>
              <p>Completed and cancelled retailer orders</p>
            </div>

            <button
              className="history-refresh-button"
              type="button"
              onClick={() => void loadOrders()}
              disabled={isLoading}
            >
              Refresh
            </button>
          </header>

          {error !== null && (
            <div className="history-alert" role="alert">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => void loadOrders()}
              >
                Retry
              </button>
            </div>
          )}

          <section className="history-filter-card" aria-label="Order history filters">
            <button
              className={filter === "ALL" ? "history-filter active" : "history-filter"}
              type="button"
              onClick={() => setFilter("ALL")}
            >
              All
              <span>{counts.all}</span>
            </button>

            <button
              className={
                filter === "COMPLETED" ? "history-filter active" : "history-filter"
              }
              type="button"
              onClick={() => setFilter("COMPLETED")}
            >
              Completed
              <span>{counts.completed}</span>
            </button>

            <button
              className={
                filter === "CANCELLED" ? "history-filter active" : "history-filter"
              }
              type="button"
              onClick={() => setFilter("CANCELLED")}
            >
              Cancelled
              <span>{counts.cancelled}</span>
            </button>
          </section>

          <section className="history-card">
            <div className="history-card-header">
              <div>
                <h2>{filter === "ALL" ? "Past Orders" : STATUS_LABELS[filter]}</h2>
                <p>
                  {filteredOrders.length}{" "}
                  {filteredOrders.length === 1 ? "order" : "orders"}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="history-state">
                Loading order history...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="history-state">
                <strong>No orders found</strong>
                <span>
                  Orders matching this status will appear here.
                </span>
              </div>
            ) : (
              <div className="history-table-scroll">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Retailer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Placed At</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong className="history-order-id">
                            #{order.id}
                          </strong>
                        </td>

                        <td>
                          <div className="history-retailer">
                            <strong>
                              Retailer{" "}
                              {getInitials(order.retailer.phoneNumber)}
                            </strong>
                            <span>
                              {order.retailer.phoneNumber}
                            </span>
                          </div>
                        </td>

                        <td>
                          {order.items.length}{" "}
                          {order.items.length === 1
                            ? "item"
                            : "items"}
                        </td>

                        <td>
                          <strong>
                            {formatAmount(order.subtotal)}
                          </strong>
                        </td>

                        <td>{formatDate(order.createdAt)}</td>

                        <td>
                          <span
                            className={`history-status history-status-${order.status.toLowerCase()}`}
                          >
                            {STATUS_LABELS[order.status as HistoryOrderStatus]}
                          </span>
                        </td>

                        <td>
                          <button
                            className="history-details-button"
                            type="button"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {selectedOrder !== null && (
            <div className="history-details-backdrop" role="presentation">
              <section
                aria-labelledby="history-details-title"
                aria-modal="true"
                className="history-details-dialog"
                role="dialog"
              >
                <header className="history-details-header">
                  <div>
                    <p>Order details</p>
                    <h2 id="history-details-title">#{selectedOrder.id}</h2>
                  </div>

                  <button
                    aria-label="Close order details"
                    className="history-details-close"
                    type="button"
                    onClick={() => setSelectedOrderId(null)}
                  >
                    ×
                  </button>
                </header>

                <div className="history-details-summary">
                  <div>
                    <span>Retailer</span>
                    <strong>Retailer {getInitials(selectedOrder.retailer.phoneNumber)}</strong>
                    <small>
                      {selectedOrder.retailer.phoneNumber} · ID #{selectedOrder.retailer.id}
                    </small>
                  </div>

                  <div>
                    <span>Placed at</span>
                    <strong>{formatDate(selectedOrder.createdAt)}</strong>
                  </div>

                  <div>
                    <span>Final status</span>
                    <strong>
                      <span
                        className={`history-status history-status-${selectedOrder.status.toLowerCase()}`}
                      >
                        {STATUS_LABELS[selectedOrder.status as HistoryOrderStatus]}
                      </span>
                    </strong>
                  </div>
                </div>

                <div className="history-details-items">
                  <h3>Ordered items</h3>

                  {selectedOrder.items.map((item) => (
                    <div className="history-details-item" key={item.id}>
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

                <footer className="history-details-total">
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

export default WholesalerOrderHistory;
