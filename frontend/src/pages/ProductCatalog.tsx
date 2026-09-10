import { useEffect, useState } from "react";

import { useAuth } from "../auth/useAuth";
import type { Product } from "../product/types";
import { addToCart } from "../cart/cartApi";
import {
  addGuestCartItem,
} from "../cart/guestCart";
import { apiRequest } from "../api/client";
import "./ProductCatalog.css";


export default function ProductCatalog() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingProductId, setAddingProductId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartMessage, setCartMessage] = useState<{
  productName: string;
  quantity: number;
} | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
       const response = await apiRequest<Product[]>("/api/products", {
        authenticated: false,
     });

        setProducts(response);
      } catch {
        setError("Unable to load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

async function handleAddToCart(productId: number) {
  setAddingProductId(productId);
  setCartMessage(null);

  try {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    if (isAuthenticated) {
      const cartItem = await addToCart(productId);

      setCartMessage({
        productName: product.name,
        quantity: cartItem.quantity,
      });
    } else {
      const items = addGuestCartItem(product);

      const addedItem = items.find(
        (item) => item.product.id === productId,
      );

      setCartMessage({
        productName: product.name,
        quantity: addedItem?.quantity ?? 1,
      });
    }
  } catch {
    setCartMessage(null);
  } finally {
    setAddingProductId(null);
  }
}
  const visibleProducts = products.filter((product) => {
    const searchableText = `${product.name} ${product.description ?? ""}`;
    return searchableText.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  if (isLoading) {
    return (
      <section className="catalog-page">
        <div className="catalog-container">
          <div className="catalog-header">
            <div>
              <span className="catalog-kicker">PRODUCT CATALOG</span>
              <h1>Products</h1>
              <p>Browse products available for your shop.</p>
            </div>
          </div>

          <div className="catalog-status">Loading products...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="catalog-page">
        <div className="catalog-container">
          <div className="catalog-header">
            <div>
              <span className="catalog-kicker">PRODUCT CATALOG</span>
              <h1>Products</h1>
              <p>Browse products available for your shop.</p>
            </div>
          </div>

          <div className="catalog-status catalog-error">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <div className="catalog-container">
        <div className="catalog-header">
          <div>
            <span className="catalog-kicker">PRODUCT CATALOG</span>
            <h1>Products</h1>
            <p>Browse products available from your wholesale network.</p>
          </div>

          <div className="product-count">{products.length} products</div>
        </div>

        <div className="catalog-tools">
          <label className="catalog-search" htmlFor="product-search">
            <span aria-hidden="true">⌕</span>
            <input id="product-search" placeholder="Search products" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </label>
          <div className="catalog-category" aria-label="Product view"><span aria-hidden="true">▦</span><strong>All products</strong></div>
        </div>

        {cartMessage && (
          <div className="catalog-cart-message">{cartMessage && (
  <div className="cart-message">
    <strong>
      ✓ {cartMessage.productName} added to cart
    </strong>
    <span>
      Quantity: {cartMessage.quantity}
    </span>
  </div>
)}</div>
        )}

        {products.length === 0 ? (
          <div className="catalog-status">
            No products are currently available.
          </div>
        ) : (
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" />
                  ) : (
                    <div className="product-image-placeholder">S</div>
                  )}
                </div>

                <div className="product-content">
                  <div>
                    <h2>{product.name}</h2>
                    <p>{product.description || "Product details available on order."}</p>
                  </div>

                  <div className="product-footer">
                    <strong>₹{product.price.toFixed(2)}</strong>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addingProductId === product.id}
                    >
                      {addingProductId === product.id
                        ? "Adding..."
                        : "Add to order"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {products.length > 0 && visibleProducts.length === 0 && (
          <div className="catalog-status">No products match “{searchTerm}”.</div>
        )}
      </div>
    </section>
  );
}
