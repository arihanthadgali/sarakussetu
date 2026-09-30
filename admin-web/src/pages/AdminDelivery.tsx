import { useCallback, useEffect, useMemo, useState } from "react";

import { getOrders, updateDelivery } from "../orders/orderApi";
import type { AdminOrder, DeliveryStatus } from "../orders/types";

const DELIVERY_FILTERS = [
  "ALL",
  "UNASSIGNED",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

type DeliveryFilter = (typeof DELIVERY_FILTERS)[number];

const NEXT_ACTION: Partial<Record<DeliveryStatus, {
  status: DeliveryStatus;
  label: string;
}>> = {
  ASSIGNED: { status: "PICKED_UP", label: "Mark picked up" },
  PICKED_UP: { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  OUT_FOR_DELIVERY: { status: "DELIVERED", label: "Mark delivered" },
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDelivery() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<DeliveryFilter>("ALL");
  const [search, setSearch] = useState("");
  const [assigningOrder, setAssigningOrder] = useState<AdminOrder | null>(null);
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setOrders(await getOrders());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load deliveries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const visibleOrders = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === "ALL" || order.deliveryStatus === filter;
      const searchable = [
        order.id,
        order.retailer.id,
        order.retailer.phoneNumber,
        order.deliveryPersonName ?? "",
        order.deliveryPersonPhone ?? "",
      ].join(" ").toLowerCase();
      return matchesFilter && searchable.includes(searchTerm);
    });
  }, [filter, orders, search]);

  async function saveDelivery(
    order: AdminOrder,
    status: DeliveryStatus,
    name?: string,
    phone?: string,
  ) {
    try {
      setSavingId(order.id);
      setError("");
      const updated = await updateDelivery(order.id, status, name, phone);
      setOrders((current) => current.map((item) => item.id === order.id ? {
        ...item,
        status: updated.status,
        deliveryStatus: updated.deliveryStatus,
        deliveryPersonName: updated.deliveryPersonName,
        deliveryPersonPhone: updated.deliveryPersonPhone,
        updatedAt: updated.updatedAt,
      } : item));
      setAssigningOrder(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save delivery.");
    } finally {
      setSavingId(null);
    }
  }

  function openAssignment(order: AdminOrder) {
    setDeliveryPersonName("");
    setDeliveryPersonPhone("");
    setAssigningOrder(order);
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Manual Delivery</h2>
          <p>Assign ready orders and move each delivery one step at a time.</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => void loadOrders()} disabled={loading || savingId !== null}>
          ↻ Refresh
        </button>
      </div>

      <div className="order-tools">
        <input type="search" aria-label="Search deliveries" placeholder="Search order, retailer, or delivery person" value={search} onChange={(event) => setSearch(event.target.value)} />
        <div className="order-filter-group" aria-label="Delivery status filters">
          {DELIVERY_FILTERS.map((status) => (
            <button key={status} type="button" className={filter === status ? "order-filter active" : "order-filter"} onClick={() => setFilter(status)}>
              {status === "ALL" ? "All" : status.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-box delivery-error">{error} <button type="button" className="retry-link" onClick={() => void loadOrders()}>Retry</button></div>}

      {loading ? <div className="empty-state">Loading deliveries…</div> : visibleOrders.length === 0 ? <div className="empty-state">No deliveries match the current search or filter.</div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Retailer</th><th>Delivery person</th><th>Order status</th><th>Delivery status</th><th>Updated</th><th>Action</th></tr></thead>
            <tbody>
              {visibleOrders.map((order) => {
                const nextAction = NEXT_ACTION[order.deliveryStatus];
                const isSaving = savingId === order.id;
                return <tr key={order.id}>
                  <td><strong>#{order.id}</strong></td>
                  <td>{order.retailer.phoneNumber}<span className="table-secondary">ID #{order.retailer.id}</span></td>
                  <td>{order.deliveryPersonName ?? "—"}<span className="table-secondary">{order.deliveryPersonPhone ?? ""}</span></td>
                  <td><span className="status-badge">{order.status}</span></td>
                  <td><span className="status-badge delivery-status">{order.deliveryStatus.replaceAll("_", " ")}</span></td>
                  <td>{formatDate(order.updatedAt)}</td>
                  <td>{order.deliveryStatus === "UNASSIGNED" ? <button type="button" className="primary-button compact" disabled={order.status !== "READY" || isSaving} onClick={() => openAssignment(order)}>{isSaving ? "Saving…" : "Assign"}</button> : nextAction ? <button type="button" className="primary-button compact" disabled={isSaving} onClick={() => void saveDelivery(order, nextAction.status)}>{isSaving ? "Saving…" : nextAction.label}</button> : <span className="table-secondary">Completed</span>}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}

      {assigningOrder !== null && (
        <div className="order-details-backdrop" role="presentation" onClick={() => savingId === null && setAssigningOrder(null)}>
          <section className="order-details delivery-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-title" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading"><div><h2 id="assignment-title">Assign delivery for order #{assigningOrder.id}</h2><p>The order must remain ready before it can be assigned.</p></div><button type="button" className="ghost-button" disabled={savingId !== null} onClick={() => setAssigningOrder(null)}>Close</button></div>
            <form className="auth-form delivery-assignment-form" onSubmit={(event) => { event.preventDefault(); void saveDelivery(assigningOrder, "ASSIGNED", deliveryPersonName, deliveryPersonPhone); }}>
              <label>Delivery person name<input required value={deliveryPersonName} onChange={(event) => setDeliveryPersonName(event.target.value)} autoFocus /></label>
              <label>Phone number <span className="muted">(optional)</span><input type="tel" value={deliveryPersonPhone} onChange={(event) => setDeliveryPersonPhone(event.target.value)} /></label>
              <button type="submit" className="primary-button" disabled={savingId !== null}>{savingId === assigningOrder.id ? "Assigning…" : "Assign delivery"}</button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
