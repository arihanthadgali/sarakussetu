import { useCallback, useEffect, useMemo, useState } from "react";

import WholesalerSidebar, {
  type WholesalerPage,
} from "../components/WholesalerSidebar";
import { getWholesalerOrders } from "../orders/orderApi";
import type { OrderStatus, WholesalerOrder } from "../orders/types";
import "./WholesalerRetailers.css";

const ACTIVE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
] as const satisfies readonly OrderStatus[];

type RetailerFilter = "ALL" | "ACTIVE_ORDERS" | "HISTORY_ONLY";

interface RetailerSummary {
  id: string;
  phoneNumber: string;
  orders: WholesalerOrder[];
  activeOrderCount: number;
  totalOrderValue: number;
  lastOrderAt: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "New",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY: "Ready for Pickup",
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

function getRetailerSuffix(phoneNumber: string) {
  return phoneNumber.slice(-2);
}

function isActiveOrder(status: OrderStatus) {
  return ACTIVE_STATUSES.includes(status as (typeof ACTIVE_STATUSES)[number]);
}

function WholesalerRetailers({
  onNavigate,
  onLogout,
}: {
  onNavigate: (page: WholesalerPage) => void;
  onLogout: () => void;
}) {
  const [orders, setOrders] = useState<WholesalerOrder[]>([]);
  const [filter, setFilter] = useState<RetailerFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRetailerId, setSelectedRetailerId] = useState<string | null>(
    null,
  );

  const loadRetailers = useCallback(async () => {
    try {
      setError(null);

      const data = await getWholesalerOrders();

      setOrders(data);
    } catch {
      setError("Unable to load retailers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRetailers();
  }, [loadRetailers]);

  const retailers = useMemo(() => {
    const retailersById = new Map<string, RetailerSummary>();

    for (const order of orders) {
      const current = retailersById.get(order.retailer.id);

      if (current === undefined) {
        retailersById.set(order.retailer.id, {
          id: order.retailer.id,
          phoneNumber: order.retailer.phoneNumber,
          orders: [order],
          activeOrderCount: isActiveOrder(order.status) ? 1 : 0,
          totalOrderValue: order.subtotal,
          lastOrderAt: order.createdAt,
        });
        continue;
      }

      current.orders.push(order);
      current.activeOrderCount += isActiveOrder(order.status) ? 1 : 0;
      current.totalOrderValue += order.subtotal;

      if (new Date(order.createdAt) > new Date(current.lastOrderAt)) {
        current.lastOrderAt = order.createdAt;
      }
    }

    return [...retailersById.values()].sort(
      (first, second) =>
        new Date(second.lastOrderAt).getTime() -
        new Date(first.lastOrderAt).getTime(),
    );
  }, [orders]);

  const counts = useMemo(
    () => ({
      all: retailers.length,
      activeOrders: retailers.filter((retailer) => retailer.activeOrderCount > 0)
        .length,
      historyOnly: retailers.filter((retailer) => retailer.activeOrderCount === 0)
        .length,
    }),
    [retailers],
  );

  const visibleRetailers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return retailers.filter((retailer) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ACTIVE_ORDERS" && retailer.activeOrderCount > 0) ||
        (filter === "HISTORY_ONLY" && retailer.activeOrderCount === 0);
      const searchableText = `${retailer.id} ${retailer.phoneNumber}`.toLowerCase();

      return matchesFilter && searchableText.includes(normalizedSearchTerm);
    });
  }, [filter, retailers, searchTerm]);

  const selectedRetailer =
    selectedRetailerId === null
      ? null
      : retailers.find((retailer) => retailer.id === selectedRetailerId) ?? null;

  return (
    <div className="wholesaler-dashboard">
      <WholesalerSidebar
        activePage="retailers"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        <div className="wholesaler-retailers-page">
          <header className="retailers-page-header">
            <div>
              <h1>Retailers</h1>
              <p>Retailers with orders assigned to your business</p>
            </div>

            <button
              className="retailers-refresh-button"
              type="button"
              onClick={() => void loadRetailers()}
              disabled={isLoading}
            >
              Refresh
            </button>
          </header>

          {error !== null && (
            <div className="retailers-alert" role="alert">
              <span>{error}</span>

              <button type="button" onClick={() => void loadRetailers()}>
                Retry
              </button>
            </div>
          )}

          <section className="retailers-tools" aria-label="Retailer filters">
            <label className="retailers-search" htmlFor="retailer-search">
              <span aria-hidden="true">⌕</span>
              <input
                id="retailer-search"
                type="search"
                placeholder="Search by retailer ID or phone"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="retailer-filter-group">
              <button
                className={filter === "ALL" ? "retailer-filter active" : "retailer-filter"}
                type="button"
                onClick={() => setFilter("ALL")}
              >
                All <span>{counts.all}</span>
              </button>

              <button
                className={
                  filter === "ACTIVE_ORDERS" ? "retailer-filter active" : "retailer-filter"
                }
                type="button"
                onClick={() => setFilter("ACTIVE_ORDERS")}
              >
                Active orders <span>{counts.activeOrders}</span>
              </button>

              <button
                className={
                  filter === "HISTORY_ONLY" ? "retailer-filter active" : "retailer-filter"
                }
                type="button"
                onClick={() => setFilter("HISTORY_ONLY")}
              >
                History only <span>{counts.historyOnly}</span>
              </button>
            </div>
          </section>

          <section className="retailers-card">
            <div className="retailers-card-header">
              <div>
                <h2>Associated retailers</h2>
                <p>
                  {visibleRetailers.length}{" "}
                  {visibleRetailers.length === 1 ? "retailer" : "retailers"}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="retailers-state">Loading retailers...</div>
            ) : visibleRetailers.length === 0 ? (
              <div className="retailers-state">
                <strong>No retailers found</strong>
                <span>
                  Retailers will appear here when orders are assigned to your business.
                </span>
              </div>
            ) : (
              <div className="retailers-table-scroll">
                <table className="retailers-table">
                  <thead>
                    <tr>
                      <th>Retailer</th>
                      <th>Retailer ID</th>
                      <th>Orders</th>
                      <th>Active Orders</th>
                      <th>Last Activity</th>
                      <th>Details</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleRetailers.map((retailer) => (
                      <tr key={retailer.id}>
                        <td>
                          <div className="retailer-contact">
                            <strong>
                              Retailer {getRetailerSuffix(retailer.phoneNumber)}
                            </strong>
                            <span>{retailer.phoneNumber}</span>
                          </div>
                        </td>
                        <td>#{retailer.id}</td>
                        <td>{retailer.orders.length}</td>
                        <td>{retailer.activeOrderCount}</td>
                        <td>{formatDate(retailer.lastOrderAt)}</td>
                        <td>
                          <button
                            className="retailer-details-button"
                            type="button"
                            onClick={() => setSelectedRetailerId(retailer.id)}
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

          {selectedRetailer !== null && (
            <div className="retailer-details-backdrop" role="presentation">
              <section
                aria-labelledby="retailer-details-title"
                aria-modal="true"
                className="retailer-details-dialog"
                role="dialog"
              >
                <header className="retailer-details-header">
                  <div>
                    <p>Retailer details</p>
                    <h2 id="retailer-details-title">
                      Retailer {getRetailerSuffix(selectedRetailer.phoneNumber)}
                    </h2>
                  </div>

                  <button
                    aria-label="Close retailer details"
                    className="retailer-details-close"
                    type="button"
                    onClick={() => setSelectedRetailerId(null)}
                  >
                    ×
                  </button>
                </header>

                <div className="retailer-details-summary">
                  <div>
                    <span>Phone number</span>
                    <strong>{selectedRetailer.phoneNumber}</strong>
                  </div>

                  <div>
                    <span>Retailer ID</span>
                    <strong>#{selectedRetailer.id}</strong>
                  </div>

                  <div>
                    <span>Assigned orders</span>
                    <strong>{selectedRetailer.orders.length}</strong>
                  </div>

                  <div>
                    <span>Active orders</span>
                    <strong>{selectedRetailer.activeOrderCount}</strong>
                  </div>
                </div>

                <div className="retailer-order-activity">
                  <div className="retailer-order-activity-header">
                    <h3>Order activity</h3>
                    <strong>{formatAmount(selectedRetailer.totalOrderValue)}</strong>
                  </div>

                  <div className="retailer-order-activity-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Status</th>
                          <th>Items</th>
                          <th>Amount</th>
                          <th>Placed At</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedRetailer.orders.map((order) => (
                          <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>
                              <span
                                className={`retailer-order-status retailer-order-status-${order.status.toLowerCase()}`}
                              >
                                {STATUS_LABELS[order.status]}
                              </span>
                            </td>
                            <td>{order.items.length}</td>
                            <td>{formatAmount(order.subtotal)}</td>
                            <td>{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default WholesalerRetailers;
