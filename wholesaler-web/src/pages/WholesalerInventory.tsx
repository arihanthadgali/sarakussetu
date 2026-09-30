import { useCallback, useEffect, useMemo, useState } from "react";

import WholesalerSidebar, {
  type WholesalerPage,
} from "../components/WholesalerSidebar";
import { getWholesalerInventory } from "../inventory/inventoryApi";
import type { WholesalerInventoryItem } from "../inventory/types";
import "./WholesalerCatalog.css";

type StockFilter = "ALL" | "IN_STOCK" | "OUT_OF_STOCK";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function WholesalerInventory({
  onNavigate,
  onLogout,
}: {
  onNavigate: (page: WholesalerPage) => void;
  onLogout: () => void;
}) {
  const [inventory, setInventory] = useState<WholesalerInventoryItem[]>([]);
  const [filter, setFilter] = useState<StockFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      setError(null);

      const data = await getWholesalerInventory();

      setInventory(data);
    } catch {
      setError("Unable to load inventory. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const counts = useMemo(
    () => ({
      all: inventory.length,
      inStock: inventory.filter((item) => item.stockQuantity > 0).length,
      outOfStock: inventory.filter((item) => item.stockQuantity === 0).length,
    }),
    [inventory],
  );

  const visibleInventory = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return inventory.filter((item) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "IN_STOCK" && item.stockQuantity > 0) ||
        (filter === "OUT_OF_STOCK" && item.stockQuantity === 0);
      const searchableText = `${item.product.name} ${item.product.id}`.toLowerCase();

      return matchesFilter && searchableText.includes(normalizedSearchTerm);
    });
  }, [filter, inventory, searchTerm]);

  return (
    <div className="wholesaler-dashboard">
      <WholesalerSidebar
        activePage="inventory"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        <div className="wholesaler-catalog-page">
          <header className="catalog-page-header">
            <div>
              <h1>Inventory</h1>
              <p>Current stock assigned to your business</p>
            </div>

            <button
              className="catalog-refresh-button"
              type="button"
              onClick={() => void loadInventory()}
              disabled={isLoading}
            >
              Refresh
            </button>
          </header>

          {error !== null && (
            <div className="catalog-alert" role="alert">
              <span>{error}</span>

              <button type="button" onClick={() => void loadInventory()}>
                Retry
              </button>
            </div>
          )}

          <section className="catalog-tools" aria-label="Inventory filters">
            <label className="catalog-search" htmlFor="wholesaler-inventory-search">
              <span aria-hidden="true">⌕</span>
              <input
                id="wholesaler-inventory-search"
                type="search"
                placeholder="Search by product or ID"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <div className="catalog-filter-group">
              <button
                className={filter === "ALL" ? "catalog-filter active" : "catalog-filter"}
                type="button"
                onClick={() => setFilter("ALL")}
              >
                All <span>{counts.all}</span>
              </button>

              <button
                className={
                  filter === "IN_STOCK" ? "catalog-filter active" : "catalog-filter"
                }
                type="button"
                onClick={() => setFilter("IN_STOCK")}
              >
                In stock <span>{counts.inStock}</span>
              </button>

              <button
                className={
                  filter === "OUT_OF_STOCK" ? "catalog-filter active" : "catalog-filter"
                }
                type="button"
                onClick={() => setFilter("OUT_OF_STOCK")}
              >
                Out of stock <span>{counts.outOfStock}</span>
              </button>
            </div>
          </section>

          <section className="catalog-card">
            <div className="catalog-card-header">
              <div>
                <h2>Stock levels</h2>
                <p>
                  {visibleInventory.length} {visibleInventory.length === 1 ? "product" : "products"}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="catalog-state">Loading inventory...</div>
            ) : visibleInventory.length === 0 ? (
              <div className="catalog-state">
                <strong>No inventory found</strong>
                <span>
                  Inventory assigned to your business will appear here.
                </span>
              </div>
            ) : (
              <div className="catalog-table-scroll">
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Product ID</th>
                      <th>Current Stock</th>
                      <th>Stock Status</th>
                      <th>Unit</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleInventory.map((item) => {
                      const isInStock = item.stockQuantity > 0;

                      return (
                        <tr key={item.product.id}>
                          <td>
                            <strong>{item.product.name}</strong>
                          </td>
                          <td>#{item.product.id}</td>
                          <td>{item.stockQuantity}</td>
                          <td>
                            <span
                              className={`catalog-status catalog-status-${
                                isInStock ? "in-stock" : "out-of-stock"
                              }`}
                            >
                              {isInStock ? "In stock" : "Out of stock"}
                            </span>
                          </td>
                          <td>{item.unit}</td>
                          <td>{formatDate(item.updatedAt)}</td>
                        </tr>
                      );
                    })}
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

export default WholesalerInventory;
