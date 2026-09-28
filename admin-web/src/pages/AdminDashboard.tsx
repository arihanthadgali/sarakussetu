import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AdminSidebar, {
  type AdminPage,
} from "../components/AdminSidebar";

import {
  assignOrder,
  getUnassignedOrders,
  getWholesalers,
} from "../orders/orderApi";

import type {
  AdminOrder,
  AdminWholesaler,
} from "../orders/types";

import { useAuth } from "../auth/useAuth";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getRetailer(order: AdminOrder): string {
  return (
    order.retailer?.phoneNumber ??
    order.customer?.phoneNumber ??
    "—"
  );
}

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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        orderData,
        wholesalerData,
      ] = await Promise.all([
        getUnassignedOrders(),
        getWholesalers(),
      ]);

      setOrders(orderData);
      setWholesalers(wholesalerData);
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

      await assignOrder(
        orderId,
        wholesalerId,
      );

      setOrders((current) =>
        current.filter(
          (order) => order.id !== orderId,
        ),
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

  const title =
    page === "orders"
      ? "Order Assignment"
      : page === "wholesalers"
        ? "Wholesalers"
        : "Admin Dashboard";

  const subtitle =
    page === "orders"
      ? "Assign incoming retailer orders to a wholesaler."
      : page === "wholesalers"
        ? "Registered wholesaler accounts available for assignment."
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
                  <strong>{orders.length}</strong>
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
                    Current unassigned orders
                  </small>
                </div>

                <div className="metric-card">
                  <span>Order Items</span>
                  <strong>{totalItems}</strong>
                  <small>
                    Across unassigned orders
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
                    orders={orders.slice(0, 6)}
                  />
                )}
              </section>
            </>
          )}

          {page === "orders" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    Unassigned Orders
                  </h2>

                  <p>
                    Select a wholesaler and assign
                    each order.
                  </p>
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

              {loading ? (
                <div className="empty-state">
                  Loading orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  No unassigned orders right now.
                </div>
              ) : (
                <div className="assignment-list">
                  {orders.map((order) => (
                    <article
                      className="assignment-card"
                      key={order.id}
                    >
                      <div className="assignment-main">
                        <div className="order-id">
                          #{order.id}
                        </div>

                        <h3>
                          {getRetailer(order)}
                        </h3>

                        <p>
                          {getItemsCount(order)} items
                          {" · "}
                          {money.format(
                            Number(order.subtotal),
                          )}
                          {" · "}
                          {formatDate(
                            order.createdAt,
                          )}
                        </p>
                      </div>

                      <div className="assignment-action">
                        <select
                          value={
                            selectedWholesaler[
                              order.id
                            ] ?? ""
                          }
                          onChange={(event) =>
                            setSelectedWholesaler(
                              (current) => ({
                                ...current,
                                [order.id]:
                                  event.target.value,
                              }),
                            )
                          }
                        >
                          <option value="">
                            Select wholesaler
                          </option>

                          {wholesalers.map(
                            (wholesaler) => (
                              <option
                                key={wholesaler.id}
                                value={
                                  wholesaler.id
                                }
                              >
                                {
                                  wholesaler.businessName
                                }{" "}
                                ·{" "}
                                {
                                  wholesaler.city
                                }
                              </option>
                            ),
                          )}
                        </select>

                        <button
                          type="button"
                          className="primary-button compact"
                          onClick={() =>
                            void handleAssign(
                              order.id,
                            )
                          }
                          disabled={
                            assigningId ===
                            order.id
                          }
                        >
                          {assigningId ===
                          order.id
                            ? "Assigning…"
                            : "Assign Order"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {page === "wholesalers" && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Wholesalers</h2>

                  <p>
                    Accounts currently available
                    to receive orders.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="empty-state">
                  Loading wholesalers…
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Business</th>
                        <th>Owner</th>
                        <th>Phone</th>
                        <th>Location</th>
                      </tr>
                    </thead>

                    <tbody>
                      {wholesalers.map(
                        (wholesaler) => (
                          <tr
                            key={wholesaler.id}
                          >
                            <td>
                              <strong>
                                {
                                  wholesaler.businessName
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                wholesaler.ownerName
                              }
                            </td>

                            <td>
                              {
                                wholesaler.phoneNumber
                              }
                            </td>

                            <td>
                              {wholesaler.city}
                              {" · "}
                              {wholesaler.pincode}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
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