import { useMemo, useState } from "react";

import type { AdminOrder, AdminWholesaler } from "../orders/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusCounts(orders: AdminOrder[]): Array<[string, number]> {
  const counts = new Map<string, number>();

  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
  }

  return [...counts.entries()];
}

export default function AdminWholesalers({
  wholesalers,
  orders,
  isLoading,
  onRefresh,
}: {
  wholesalers: AdminWholesaler[];
  orders: AdminOrder[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWholesaler, setSelectedWholesaler] =
    useState<AdminWholesaler | null>(null);

  const ordersByWholesaler = useMemo(() => {
    const groupedOrders = new Map<string, AdminOrder[]>();

    for (const order of orders) {
      if (order.wholesaler === null) {
        continue;
      }

      const assignedOrders = groupedOrders.get(order.wholesaler.id) ?? [];
      assignedOrders.push(order);
      groupedOrders.set(order.wholesaler.id, assignedOrders);
    }

    return groupedOrders;
  }, [orders]);

  const visibleWholesalers = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return wholesalers.filter((wholesaler) =>
      [wholesaler.id, wholesaler.businessName, wholesaler.phoneNumber]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearchTerm),
    );
  }, [searchTerm, wholesalers]);

  const selectedOrders =
    selectedWholesaler === null
      ? []
      : (ordersByWholesaler.get(selectedWholesaler.id) ?? []);

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Wholesalers</h2>
            <p>Registered accounts and their assigned order workload.</p>
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

        <div className="wholesaler-tools">
          <input
            type="search"
            aria-label="Search wholesalers"
            placeholder="Search ID, business, or phone"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="empty-state">Loading wholesalers…</div>
        ) : visibleWholesalers.length === 0 ? (
          <div className="empty-state">
            {wholesalers.length === 0
              ? "No wholesalers registered yet."
              : "No wholesalers match the current search."}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="wholesaler-operations-table">
              <thead>
                <tr>
                  <th>Wholesaler</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Assigned Orders</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleWholesalers.map((wholesaler) => {
                  const assignedOrders = ordersByWholesaler.get(wholesaler.id) ?? [];

                  return (
                    <tr key={wholesaler.id}>
                      <td>
                        <strong>{wholesaler.businessName}</strong>
                        <span className="table-secondary">ID #{wholesaler.id}</span>
                      </td>
                      <td>{wholesaler.phoneNumber}</td>
                      <td>{wholesaler.city} · {wholesaler.pincode}</td>
                      <td>{assignedOrders.length}</td>
                      <td>
                        <button
                          type="button"
                          className="ghost-button order-view-button"
                          onClick={() => setSelectedWholesaler(wholesaler)}
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

      {selectedWholesaler !== null && (
        <WholesalerDetails
          wholesaler={selectedWholesaler}
          orders={selectedOrders}
          onClose={() => setSelectedWholesaler(null)}
        />
      )}
    </>
  );
}

function WholesalerDetails({
  wholesaler,
  orders,
  onClose,
}: {
  wholesaler: AdminWholesaler;
  orders: AdminOrder[];
  onClose: () => void;
}) {
  const statusCounts = getStatusCounts(orders);

  return (
    <div className="order-details-backdrop" role="presentation" onClick={onClose}>
      <section
        className="order-details wholesaler-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wholesaler-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <h2 id="wholesaler-details-title">{wholesaler.businessName}</h2>
            <p>Wholesaler ID #{wholesaler.id}</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
        </div>
        <div className="order-details-content">
          <dl className="order-details-summary">
            <div><dt>Owner</dt><dd>{wholesaler.ownerName}</dd></div>
            <div><dt>Phone</dt><dd>{wholesaler.phoneNumber}</dd></div>
            <div><dt>Location</dt><dd>{wholesaler.city} · {wholesaler.pincode}</dd></div>
            <div><dt>Assigned orders</dt><dd>{orders.length}</dd></div>
          </dl>

          <h3 className="details-section-title">Order workload</h3>
          {statusCounts.length === 0 ? (
            <p className="details-empty">No orders are currently assigned.</p>
          ) : (
            <div className="workload-counts">
              {statusCounts.map(([status, count]) => (
                <span key={status}><strong>{count}</strong> {status}</span>
              ))}
            </div>
          )}

          <h3 className="details-section-title">Assigned orders</h3>
          {orders.length === 0 ? (
            <p className="details-empty">No assigned orders to show.</p>
          ) : (
            <table>
              <thead><tr><th>Order ID</th><th>Retailer</th><th>Status</th><th>Placed</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.retailer.phoneNumber}</td>
                    <td><span className="status-badge">{order.status}</span></td>
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
