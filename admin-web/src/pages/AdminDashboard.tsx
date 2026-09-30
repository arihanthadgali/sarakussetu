import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminSidebar, {
  type AdminPage,
} from "../components/AdminSidebar";
import AdminWholesalers from "./AdminWholesalers";
import AdminRetailers from "./AdminRetailers";
import AdminProducts from "./AdminProducts";
import AdminDelivery from "./AdminDelivery";
import AdminOperations from "./AdminOperations";
import AdminNotifications from "./AdminNotifications";
import AdminSettings from "./AdminSettings";
import AdminPayments from "./AdminPayments";

import {
  assignOrder,
  getOrders,
  getWholesalers,
} from "../orders/orderApi";

import type {
  AdminOrder,
  AdminWholesaler,
} from "../orders/types";

import { useAuth } from "../auth/useAuth";
import { getRetailers } from "../retailers/retailerApi";
import type { AdminRetailer } from "../retailers/types";
import { getProducts } from "../products/productApi";
import type { AdminProduct } from "../products/types";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getRetailer(order: AdminOrder): string {
  return order.retailer.phoneNumber;
}

const ORDER_FILTERS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

type OrderFilter = (typeof ORDER_FILTERS)[number];

function getItemsCount(order: AdminOrder): number {
  return order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const { logout } = useAuth();

  const [page, setPage] =
    useState<AdminPage>("dashboard");

  const [orders, setOrders] =
    useState<AdminOrder[]>([]);

  const [wholesalers, setWholesalers] =
    useState<AdminWholesaler[]>([]);

  const [retailers, setRetailers] = useState<AdminRetailer[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [assigningId, setAssigningId] =
    useState<string | null>(null);

  const [selectedWholesaler, setSelectedWholesaler] =
    useState<Record<string, string>>({});

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [filter, setFilter] = useState<OrderFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        orderData,
        wholesalerData,
        retailerData,
        productData,
      ] = await Promise.all([
        getOrders(),
        getWholesalers(),
        getRetailers(),
        getProducts(),
      ]);

      setOrders(orderData);
      setWholesalers(wholesalerData);
      setRetailers(retailerData);
      setProducts(productData);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load admin data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalValue = useMemo(
    () =>
      orders.reduce(
        (total, order) =>
          total + Number(order.subtotal),
        0,
      ),
    [orders],
  );

  const totalItems = useMemo(
    () =>
      orders.reduce(
        (total, order) =>
          total + getItemsCount(order),
        0,
      ),
    [orders],
  );

  async function handleAssign(orderId: string) {
    const wholesalerId =
      selectedWholesaler[orderId];

    if (!wholesalerId) {
      setError(
        "Select a wholesaler before assigning the order.",
      );
      return;
    }

    try {
      setAssigningId(orderId);
      setError("");
      setSuccess("");

      const updatedOrder = await assignOrder(
        orderId,
        wholesalerId,
      );

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: updatedOrder.status,
                subtotal: updatedOrder.subtotal,
                updatedAt: updatedOrder.updatedAt,
                wholesaler: updatedOrder.wholesaler,
              }
            : order,
        ),
      );
      setSelectedOrder((current) =>
        current?.id === orderId
          ? {
              ...current,
              status: updatedOrder.status,
              subtotal: updatedOrder.subtotal,
              updatedAt: updatedOrder.updatedAt,
              wholesaler: updatedOrder.wholesaler,
            }
          : current,
      );

      setSelectedWholesaler((current) => {
        const next = { ...current };
        delete next[orderId];
        return next;
      });

      setSuccess(
        `Order ${orderId} assigned successfully.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to assign order.",
      );
    } finally {
      setAssigningId(null);
    }
  }

  const unassignedOrders = useMemo(
    () => orders.filter((order) => order.wholesaler === null),
    [orders],
  );

  const visibleOrders = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter = filter === "ALL" || order.status === filter;
      const searchableText = [
        order.id,
        order.retailer.id,
        order.retailer.phoneNumber,
        order.wholesaler?.id ?? "",
        order.wholesaler?.businessName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableText.includes(normalizedSearchTerm);
    });
  }, [filter, orders, searchTerm]);

  const title =
    page === "orders"
      ? "Orders"
      : page === "retailers"
        ? "Retailers"
      : page === "products"
        ? "Products"
      : page === "wholesalers"
        ? "Wholesalers"
      : page === "delivery"
          ? "Delivery"
          : page === "operations"
            ? "Operations"
            : page === "notifications"
              ? "Notifications"
              : page === "settings"
                ? "Settings"
                : page === "payments"
                  ? "Payments"
        : "Admin Dashboard";

  const subtitle =
    page === "orders"
      ? "Review order status, details, and wholesaler assignment."
      : page === "retailers"
        ? "Review registered retailer accounts and order activity."
      : page === "products"
        ? "Review the product catalog and availability status."
      : page === "wholesalers"
        ? "Registered wholesaler accounts available for assignment."
        : page === "delivery"
          ? "Manually assign ready orders and update delivery progress."
          : page === "operations"
            ? "Read-only view of orders that need operational attention."
            : page === "notifications"
              ? "Recent order and delivery updates."
              : page === "settings"
                ? "Your administrator account information."
                : page === "payments"
                  ? "Retailer payments received by the platform."
        : "Overview of SarakuSetu platform operations.";

  return (
    <div className="app-shell">
      <AdminSidebar
        activePage={page}
        onNavigate={setPage}
        onLogout={logout}
      />

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              SARAKUSETU ADMIN
            </p>

            <h1>{title}</h1>

            <p className="muted">
              {subtitle}
            </p>
          </div>

          <div className="admin-profile">
            <span className="notification">
              ♢
            </span>

            <div className="avatar">
              A
            </div>

            <div>
              <strong>Admin User</strong>
              <span>Super Admin</span>
            </div>
          </div>
        </header>

        <section className="content">
          {error && (
            <div className="error-box page-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-box page-message">
              {success}
            </div>
          )}

          {page === "dashboard" && (
            <>
              <section className="metric-grid">
                <div className="metric-card">
                  <span>Unassigned Orders</span>
                  <strong>{unassignedOrders.length}</strong>
                  <small>
                    Needs wholesaler assignment
                  </small>
                </div>

                <div className="metric-card">
                  <span>Total Wholesalers</span>
                  <strong>
                    {wholesalers.length}
                  </strong>
                  <small>
                    Available for assignment
                  </small>
                </div>

                <div className="metric-card">
                  <span>Pending Value</span>
                  <strong>
                    {money.format(totalValue)}
                  </strong>
                  <small>
                    Across all orders
                  </small>
                </div>

                <div className="metric-card">
                  <span>Order Items</span>
                  <strong>{totalItems}</strong>
                  <small>
                    Across all orders
                  </small>
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Orders Awaiting Assignment
                    </h2>

                    <p>
                      Retailer orders that do not
                      yet have a wholesaler.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      setPage("orders")
                    }
                  >
                    View all →
                  </button>
                </div>

                {loading ? (
                  <div className="empty-state">
                    Loading orders…
                  </div>
                ) : (
                  <OrderTable
                    orders={unassignedOrders.slice(0, 6)}
                  />
                )}
              </section>
            </>
          )}

          {page === "orders" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>All Orders</h2>

                  <p>Review details and assign or reassign a wholesaler.</p>
                </div>

                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setSuccess("");
                    void loadData();
                  }}
                  disabled={loading}
                >
                  ↻ Refresh
                </button>
              </div>

              <div className="order-tools">
                <input
                  type="search"
                  aria-label="Search orders"
                  placeholder="Search order, retailer, or wholesaler"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />

                <div className="order-filter-group" aria-label="Order status filters">
                  {ORDER_FILTERS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={filter === status ? "order-filter active" : "order-filter"}
                      onClick={() => setFilter(status)}
                    >
                      {status === "ALL" ? "All" : status}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="empty-state">
                  Loading orders…
                </div>
              ) : visibleOrders.length === 0 ? (
                <div className="empty-state">
                  No orders match the current search or filter.
                </div>
              ) : (
                <OrderOperationsTable
                  orders={visibleOrders}
                  wholesalers={wholesalers}
                  selectedWholesaler={selectedWholesaler}
                  assigningId={assigningId}
                  onSelectedWholesalerChange={(orderId, wholesalerId) =>
                    setSelectedWholesaler((current) => ({ ...current, [orderId]: wholesalerId }))
                  }
                  onAssign={handleAssign}
                  onView={setSelectedOrder}
                />
              )}
            </section>
          )}

          {selectedOrder !== null && (
            <OrderDetails
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
            />
          )}

          {page === "wholesalers" && (
            <AdminWholesalers
              wholesalers={wholesalers}
              orders={orders}
              isLoading={loading}
              onRefresh={() => {
                setSuccess("");
                void loadData();
              }}
            />
          )}

          {page === "retailers" && (
            <AdminRetailers
              retailers={retailers}
              orders={orders}
              isLoading={loading}
              onRefresh={() => {
                setSuccess("");
                void loadData();
              }}
            />
          )}

          {page === "products" && (
            <AdminProducts
              products={products}
              isLoading={loading}
              onRefresh={() => {
                setSuccess("");
                void loadData();
              }}
            />
          )}

          {page === "delivery" && <AdminDelivery />}

          {page === "operations" && <AdminOperations />}

          {page === "notifications" && <AdminNotifications />}

          {page === "settings" && <AdminSettings />}

          {page === "payments" && <AdminPayments />}
        </section>
      </main>
    </div>
  );
}

function OrderTable({
  orders,
}: {
  orders: AdminOrder[];
}) {
  if (orders.length === 0) {
    return (
      <div className="empty-state">
        No unassigned orders.
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Retailer</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Placed At</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong>#{order.id}</strong>
              </td>

              <td>
                {getRetailer(order)}
              </td>

              <td>
                {getItemsCount(order)}
              </td>

              <td>
                {money.format(
                  Number(order.subtotal),
                )}
              </td>

              <td>
                {formatDate(order.createdAt)}
              </td>

              <td>
                <span className="status-badge">
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderOperationsTable({
  orders,
  wholesalers,
  selectedWholesaler,
  assigningId,
  onSelectedWholesalerChange,
  onAssign,
  onView,
}: {
  orders: AdminOrder[];
  wholesalers: AdminWholesaler[];
  selectedWholesaler: Record<string, string>;
  assigningId: string | null;
  onSelectedWholesalerChange: (orderId: string, wholesalerId: string) => void;
  onAssign: (orderId: string) => Promise<void>;
  onView: (order: AdminOrder) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="order-operations-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Retailer</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Wholesaler</th>
            <th>Placed At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><strong>#{order.id}</strong></td>
              <td>
                <strong>{order.retailer.phoneNumber}</strong>
                <span className="table-secondary">ID #{order.retailer.id}</span>
              </td>
              <td>{money.format(order.subtotal)}</td>
              <td><span className="status-badge">{order.status}</span></td>
              <td>
                <span className="table-secondary">
                  {order.wholesaler === null
                    ? "Unassigned"
                    : `${order.wholesaler.businessName} · #${order.wholesaler.id}`}
                </span>
              </td>
              <td>{formatDate(order.createdAt)}</td>
              <td>
                <div className="order-row-actions">
                  <button type="button" className="ghost-button order-view-button" onClick={() => onView(order)}>
                    Details
                  </button>
                  <select
                    aria-label={`Assign wholesaler for order ${order.id}`}
                    value={selectedWholesaler[order.id] ?? order.wholesaler?.id ?? ""}
                    onChange={(event) => onSelectedWholesalerChange(order.id, event.target.value)}
                    disabled={assigningId === order.id}
                  >
                    <option value="">Select wholesaler</option>
                    {wholesalers.map((wholesaler) => (
                      <option key={wholesaler.id} value={wholesaler.id}>
                        {wholesaler.businessName} · {wholesaler.city}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="primary-button compact"
                    onClick={() => void onAssign(order.id)}
                    disabled={assigningId === order.id}
                  >
                    {assigningId === order.id
                      ? "Saving…"
                      : order.wholesaler === null
                        ? "Assign"
                        : "Reassign"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderDetails({
  order,
  onClose,
}: {
  order: AdminOrder;
  onClose: () => void;
}) {
  return (
    <div className="order-details-backdrop" role="presentation" onClick={onClose}>
      <section
        className="order-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <h2 id="order-details-title">Order #{order.id}</h2>
            <p>Placed {formatDate(order.createdAt)}</p>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>Close</button>
        </div>
        <div className="order-details-content">
          <dl className="order-details-summary">
            <div><dt>Retailer</dt><dd>{order.retailer.phoneNumber} · ID #{order.retailer.id}</dd></div>
            <div><dt>Status</dt><dd><span className="status-badge">{order.status}</span></dd></div>
            <div><dt>Wholesaler</dt><dd>{order.wholesaler === null ? "Unassigned" : `${order.wholesaler.businessName} · #${order.wholesaler.id}`}</dd></div>
            <div><dt>Last updated</dt><dd>{formatDate(order.updatedAt)}</dd></div>
          </dl>
          <table>
            <thead><tr><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productName} <span className="table-secondary">#{item.productId}</span></td>
                  <td>{item.quantity}</td>
                  <td>{money.format(item.unitPrice)}</td>
                  <td>{money.format(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="order-total"><strong>Subtotal / Total</strong><strong>{money.format(order.subtotal)}</strong></div>
        </div>
      </section>
    </div>
  );
}
