import { useMemo, useState } from "react";

import type { AdminOrder } from "../orders/types";
import type { AdminRetailer } from "../retailers/types";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminRetailers({
  retailers,
  orders,
  isLoading,
  onRefresh,
}: {
  retailers: AdminRetailer[];
  orders: AdminOrder[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRetailer, setSelectedRetailer] =
    useState<AdminRetailer | null>(null);

  const ordersByRetailer = useMemo(() => {
    const groupedOrders = new Map<string, AdminOrder[]>();

    for (const order of orders) {
      const retailerOrders = groupedOrders.get(order.retailer.id) ?? [];
      retailerOrders.push(order);
      groupedOrders.set(order.retailer.id, retailerOrders);
    }

    return groupedOrders;
  }, [orders]);

  const visibleRetailers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return retailers.filter((retailer) =>
      [retailer.id, retailer.phoneNumber]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm),
    );
  }, [retailers, searchTerm]);

  const selectedOrders =
    selectedRetailer === null
      ? []
      : (ordersByRetailer.get(selectedRetailer.id) ?? []);

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Retailers</h2>
            <p>Registered retailer accounts and their order activity.</p>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={onRefresh}
            disabled={isLoading}
          >
            ↻ Refresh
          </button>
        </div>

        <div className="retailer-tools">
          <input
            type="search"
            aria-label="Search retailers"
            placeholder="Search retailer ID or phone"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="empty-state">Loading retailers…</div>
        ) : visibleRetailers.length === 0 ? (
          <div className="empty-state">
            {retailers.length === 0
              ? "No retailers registered yet."
              : "No retailers match the current search."}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="retailer-operations-table">
              <thead>
                <tr>
                  <th>Retailer ID</th>
                  <th>Phone</th>
                  <th>Registered</th>
                  <th>Orders</th>
                  <th>Latest Order</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRetailers.map((retailer) => {
                  const retailerOrders = ordersByRetailer.get(retailer.id) ?? [];
                  const latestOrder = retailerOrders[0];

                  return (
                    <tr key={retailer.id}>
                      <td><strong>#{retailer.id}</strong></td>
                      <td>{retailer.phoneNumber}</td>
                      <td>{formatDate(retailer.createdAt)}</td>
                      <td>{retailerOrders.length}</td>
                      <td>
                        {latestOrder === undefined ? (
                          <span className="table-secondary">No orders yet</span>
                        ) : (
                          <>
                            <strong>#{latestOrder.id}</strong>
                            <span className="table-secondary">
                              {latestOrder.status} · {formatDate(latestOrder.createdAt)}
                            </span>
                          </>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ghost-button order-view-button"
                          onClick={() => setSelectedRetailer(retailer)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedRetailer !== null && (
        <RetailerDetails
          retailer={selectedRetailer}
          orders={selectedOrders}
          onClose={() => setSelectedRetailer(null)}
        />
      )}
    </>
  );
}

function RetailerDetails({
  retailer,
  orders,
  onClose,
}: {
  retailer: AdminRetailer;
  orders: AdminOrder[];
  onClose: () => void;
}) {
  return (
    <div className="order-details-backdrop" role="presentation" onClick={onClose}>
      <section
        className="order-details retailer-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="retailer-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <h2 id="retailer-details-title">Retailer #{retailer.id}</h2>
            <p>{retailer.phoneNumber}</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
        </div>
        <div className="order-details-content">
          <dl className="order-details-summary">
            <div><dt>Retailer ID</dt><dd>#{retailer.id}</dd></div>
            <div><dt>Phone</dt><dd>{retailer.phoneNumber}</dd></div>
            <div><dt>Registered</dt><dd>{formatDate(retailer.createdAt)}</dd></div>
            <div><dt>Order count</dt><dd>{orders.length}</dd></div>
          </dl>

          <h3 className="details-section-title">Orders</h3>
          {orders.length === 0 ? (
            <p className="details-empty">No orders placed yet.</p>
          ) : (
            <table>
              <thead><tr><th>Order ID</th><th>Status</th><th>Amount</th><th>Order Date</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td><span className="status-badge">{order.status}</span></td>
                    <td>{money.format(order.subtotal)}</td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
