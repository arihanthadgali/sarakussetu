import { useCallback, useEffect, useMemo, useState } from "react";

import { getOrders } from "../orders/orderApi";
import type { AdminOrder } from "../orders/types";

const QUEUES = [
  "ALL_ACTIVE",
  "AWAITING_WHOLESALER",
  "WHOLESALER_IN_PROGRESS",
  "AWAITING_DELIVERY_ASSIGNMENT",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

type Queue = (typeof QUEUES)[number];

const QUEUE_LABELS: Record<Queue, string> = {
  ALL_ACTIVE: "All active",
  AWAITING_WHOLESALER: "Awaiting wholesaler",
  WHOLESALER_IN_PROGRESS: "Wholesaler in progress",
  AWAITING_DELIVERY_ASSIGNMENT: "Awaiting delivery assignment",
  ASSIGNED: "Assigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
};

function isCancelled(order: AdminOrder): boolean {
  return order.status === "CANCELLED";
}

function isAwaitingWholesaler(order: AdminOrder): boolean {
  return !isCancelled(order) && order.wholesaler === null;
}

function isWholesalerInProgress(order: AdminOrder): boolean {
  return order.wholesaler !== null && !isCancelled(order) && order.status !== "READY" && order.status !== "COMPLETED";
}

function isAwaitingDeliveryAssignment(order: AdminOrder): boolean {
  return !isCancelled(order) && order.status === "READY" && order.deliveryStatus === "UNASSIGNED";
}

function belongsToQueue(order: AdminOrder, queue: Queue): boolean {
  switch (queue) {
    case "ALL_ACTIVE":
      return !isCancelled(order) && order.status !== "COMPLETED";
    case "AWAITING_WHOLESALER":
      return isAwaitingWholesaler(order);
    case "WHOLESALER_IN_PROGRESS":
      return isWholesalerInProgress(order);
    case "AWAITING_DELIVERY_ASSIGNMENT":
      return isAwaitingDeliveryAssignment(order);
    case "ASSIGNED":
    case "PICKED_UP":
    case "OUT_FOR_DELIVERY":
      return !isCancelled(order) && order.deliveryStatus === queue;
    case "DELIVERED":
      return order.deliveryStatus === "DELIVERED" && order.status === "COMPLETED";
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminOperations() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queue, setQueue] = useState<Queue>("ALL_ACTIVE");
  const [search, setSearch] = useState("");

  const loadOperations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setOrders(await getOrders());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load operations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOperations();
  }, [loadOperations]);

  const counts = useMemo(() => ({
    awaitingWholesaler: orders.filter(isAwaitingWholesaler).length,
    wholesalerInProgress: orders.filter(isWholesalerInProgress).length,
    awaitingDeliveryAssignment: orders.filter(isAwaitingDeliveryAssignment).length,
    assigned: orders.filter((order) => !isCancelled(order) && order.deliveryStatus === "ASSIGNED").length,
    pickedUp: orders.filter((order) => !isCancelled(order) && order.deliveryStatus === "PICKED_UP").length,
    outForDelivery: orders.filter((order) => !isCancelled(order) && order.deliveryStatus === "OUT_FOR_DELIVERY").length,
    delivered: orders.filter((order) => order.deliveryStatus === "DELIVERED" && order.status === "COMPLETED").length,
  }), [orders]);

  const visibleOrders = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return orders.filter((order) => {
      const searchable = [
        order.id,
        order.retailer.id,
        order.retailer.phoneNumber,
        order.wholesaler?.id ?? "",
        order.wholesaler?.businessName ?? "",
        order.deliveryPersonName ?? "",
        order.deliveryPersonPhone ?? "",
      ].join(" ").toLowerCase();
      return belongsToQueue(order, queue) && searchable.includes(searchTerm);
    });
  }, [orders, queue, search]);

  return (
    <>
      <section className="metric-grid operations-summary" aria-label="Operational summary">
        <SummaryCard label="Awaiting wholesaler" count={counts.awaitingWholesaler} />
        <SummaryCard label="Wholesaler in progress" count={counts.wholesalerInProgress} />
        <SummaryCard label="Ready for delivery assignment" count={counts.awaitingDeliveryAssignment} />
        <SummaryCard label="Assigned deliveries" count={counts.assigned} />
        <SummaryCard label="Picked-up deliveries" count={counts.pickedUp} />
        <SummaryCard label="Out for delivery" count={counts.outForDelivery} />
        <SummaryCard label="Delivered / completed" count={counts.delivered} />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Operational queues</h2>
            <p>Cancelled orders are excluded from active queues.</p>
          </div>
          <button type="button" className="ghost-button" onClick={() => void loadOperations()} disabled={loading}>
            ↻ Refresh
          </button>
        </div>

        <div className="order-tools">
          <input type="search" aria-label="Search operations" placeholder="Search order, retailer, wholesaler, or delivery person" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="order-filter-group" aria-label="Operational queue filters">
            {QUEUES.map((item) => <button key={item} type="button" className={queue === item ? "order-filter active" : "order-filter"} onClick={() => setQueue(item)}>{QUEUE_LABELS[item]}</button>)}
          </div>
        </div>

        {error && <div className="error-box operations-error">{error} <button type="button" className="retry-link" onClick={() => void loadOperations()}>Retry</button></div>}

        {loading ? <div className="empty-state">Loading operations…</div> : visibleOrders.length === 0 ? <div className="empty-state">No orders in this operational queue.</div> : (
          <div className="table-wrap">
            <table className="operations-table">
              <thead><tr><th>Order</th><th>Retailer</th><th>Wholesaler</th><th>Order status</th><th>Delivery status</th><th>Delivery person</th><th>Updated</th></tr></thead>
              <tbody>{visibleOrders.map((order) => <tr key={order.id}>
                <td><strong>#{order.id}</strong></td>
                <td>{order.retailer.phoneNumber}<span className="table-secondary">ID #{order.retailer.id}</span></td>
                <td>{order.wholesaler === null ? "Unassigned" : order.wholesaler.businessName}<span className="table-secondary">{order.wholesaler === null ? "" : `ID #${order.wholesaler.id}`}</span></td>
                <td><span className="status-badge">{order.status}</span></td>
                <td><span className="status-badge delivery-status">{order.deliveryStatus.replaceAll("_", " ")}</span></td>
                <td>{order.deliveryPersonName ?? "—"}<span className="table-secondary">{order.deliveryPersonPhone ?? ""}</span></td>
                <td>{formatDate(order.updatedAt)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return <div className="metric-card"><span>{label}</span><strong>{count}</strong><small>Orders</small></div>;
}
