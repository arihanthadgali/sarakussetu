import { useCallback, useEffect, useMemo, useState } from "react";

import WholesalerSidebar, {
  type WholesalerPage,
} from "../components/WholesalerSidebar";
import { getWholesalerInventory } from "../inventory/inventoryApi";
import type { WholesalerInventoryItem } from "../inventory/types";
import "./WholesalerCatalog.css";

type ProductFilter = "ALL" | "ACTIVE" | "INACTIVE";

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

function WholesalerProducts({
  onNavigate,
  onLogout,
}: {
  onNavigate: (page: WholesalerPage) => void;
  onLogout: () => void;
}) {
  const [products, setProducts] = useState<WholesalerInventoryItem[]>([]);
  const [filter, setFilter] = useState<ProductFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setError(null);

      const data = await getWholesalerInventory();

      setProducts(data);
    } catch {
      setError("Unable to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((item) => item.product.active).length,
      inactive: products.filter((item) => !item.product.active).length,
    }),
    [products],
  );

  const visibleProducts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return products.filter((item) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ACTIVE" && item.product.active) ||
        (filter === "INACTIVE" && !item.product.active);
      const searchableText = `${item.product.name} ${item.product.id}`.toLowerCase();

      return matchesFilter && searchableText.includes(normalizedSearchTerm);
    });
  }, [filter, products, searchTerm]);

  return (
    <div className="wholesaler-dashboard">
      <WholesalerSidebar
        activePage="products"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      <main className="dashboard-main">
        <div className="wholesaler-catalog-page">
          <header className="catalog-page-header">
            <div>
              <h1>Products</h1>
              <p>Products assigned to your inventory</p>
            </div>

            <button
              className="catalog-refresh-button"
              type="button"
              onClick={() => void loadProducts()}
              disabled={isLoading}
            >
              Refresh
            </button>
          </header>

          {error !== null && (
            <div className="catalog-alert" role="alert">
              <span>{error}</span>

              <button type="button" onClick={() => void loadProducts()}>
                Retry
              </button>
            </div>
          )}

          <section className="catalog-tools" aria-label="Product filters">
            <label className="catalog-search" htmlFor="wholesaler-product-search">
              <span aria-hidden="true">⌕</span>
              <input
                id="wholesaler-product-search"
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
                  filter === "ACTIVE" ? "catalog-filter active" : "catalog-filter"
                }
                type="button"
                onClick={() => setFilter("ACTIVE")}
              >
                Active <span>{counts.active}</span>
              </button>

              <button
                className={
                  filter === "INACTIVE" ? "catalog-filter active" : "catalog-filter"
                }
                type="button"
                onClick={() => setFilter("INACTIVE")}
              >
                Inactive <span>{counts.inactive}</span>
              </button>
            </div>
          </section>

          <section className="catalog-card">
            <div className="catalog-card-header">
              <div>
                <h2>Catalog</h2>
                <p>
                  {visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="catalog-state">Loading products...</div>
            ) : visibleProducts.length === 0 ? (
              <div className="catalog-state">
                <strong>No products found</strong>
                <span>
                  Products assigned to your inventory will appear here.
                </span>
              </div>
            ) : (
              <div className="catalog-table-scroll">
                <table className="catalog-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Product ID</th>
                      <th>Unit Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Updated</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleProducts.map((item) => (
                      <tr key={item.product.id}>
                        <td>
                          <strong>{item.product.name}</strong>
                        </td>
                        <td>#{item.product.id}</td>
                        <td>
                          <strong>{formatAmount(item.product.price)}</strong>
                        </td>
                        <td>
                          {item.stockQuantity} {item.unit}
                        </td>
                        <td>
                          <span
                            className={`catalog-status catalog-status-${
                              item.product.active ? "active" : "inactive"
                            }`}
                          >
                            {item.product.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>{formatDate(item.updatedAt)}</td>
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

export default WholesalerProducts;
