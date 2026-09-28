import { useCallback, useEffect, useMemo, useState } from "react";

import WholesalerSidebar, {
  type WholesalerPage,
} from "../components/WholesalerSidebar";
import {
  getWholesalerOrders,
} from "../orders/orderApi";
import type { WholesalerOrder } from "../orders/types";
import "./WholesalerOrderHistory.css";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        (order) =>
          order.status === "COMPLETED" ||
          order.status === "CANCELLED",
      ),
    [orders],
  );

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

          <section className="history-card">
            <div className="history-card-header">
              <div>
                <h2>Past Orders</h2>
                <p>
                  {historyOrders.length}{" "}
                  {historyOrders.length === 1 ? "order" : "orders"}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="history-state">
                Loading order history...
              </div>
            ) : historyOrders.length === 0 ? (
              <div className="history-state">
                <strong>No order history</strong>
                <span>
                  Completed or cancelled orders will appear here.
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
                    </tr>
                  </thead>

                  <tbody>
                    {historyOrders.map((order) => (
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
                            {order.status === "COMPLETED"
                              ? "Completed"
                              : "Cancelled"}
                          </span>
                        </td>
                      </tr>
                    ))}
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

export default WholesalerOrderHistory;
